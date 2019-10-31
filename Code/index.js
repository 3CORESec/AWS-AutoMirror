var aws = require('aws-sdk');
var ec2 = new aws.EC2();

exports.handler = function (event, context, callback) {

    var params = {
        Filters: [
            {
                Name: "tag:mirror",
                Values: ["true"]
            }
        ]
    };

    if (event.detail)
        params.InstanceIds = [event.detail['instance-id']];

    ec2.describeTrafficMirrorSessions({}, async function (err, sessionInfo) {
        if (err)
            console.log(err, err.stack);
        else {

            var takenSessionNumbers = null;
            try {
                takenSessionNumbers = sessionInfo.TrafficMirrorSessions.map(sess => sess.SessionNumber);
            }
            catch (err) {
                takenSessionNumbers = []
            }

            var existingNetIds = sessionInfo.TrafficMirrorSessions.map(sess => sess.NetworkInterfaceId);

            ec2.describeInstances(params, function (err, data) {
                if (err)
                    console.log(err, err.stack);
                else {
                    ec2.describeTrafficMirrorTargets({}, function (err, mirrTargetData) {
                        if (err)
                            console.log(err, err.stack);
                        else {
                            ec2.describeTrafficMirrorFilters({}, async function (err, mirrFilterData) {
                                if (err) console.log(err, err.stack);
                                else {
                                    var tasks = [];
                                    var mirrTargets = [];
                                    var netIds = [];
                                    var instIds = [];
                                    var mirrFilters = [];
                                    var masterMirrTarget = null;
                                    var masterMirrFilter = null;

                                    if (mirrTargetData.TrafficMirrorTargets && mirrTargetData.TrafficMirrorTargets.length == 1)
                                        masterMirrTarget = mirrTargetData.TrafficMirrorTargets[0].TrafficMirrorTargetId;

                                    if (mirrFilterData.TrafficMirrorFilters && mirrFilterData.TrafficMirrorFilters.length == 1)
                                        masterMirrFilter = mirrFilterData.TrafficMirrorFilters[0].TrafficMirrorFilterId;

                                    data
                                        .Reservations.forEach(res =>
                                            res.Instances.forEach(inst => {
                                                if (!existingNetIds.includes(inst.NetworkInterfaces[0].NetworkInterfaceId)) {

                                                    if (inst.Tags.map(x => x.Key).includes('mirrorTarget'))
                                                        mirrTargets.push(inst.Tags[inst.Tags.map(x => x.Key).indexOf('mirrorTarget')].Value);
                                                    else
                                                        mirrTargets.push(masterMirrTarget);

                                                    if (inst.Tags.map(x => x.Key).includes('mirrorFilter'))
                                                        mirrFilters.push(inst.Tags[inst.Tags.map(x => x.Key).indexOf('mirrorFilter')].Value);
                                                    else
                                                        mirrFilters.push(masterMirrFilter);
                                                    instIds.push(inst.InstanceId);
                                                    netIds.push(inst.NetworkInterfaces[0].NetworkInterfaceId);
                                                }
                                            })
                                        );

                                    // console.log(netIds);
                                    // console.log(mirrTargets);
                                    // console.log(mirrFilters);

                                    netIds.forEach((netId, index) => {

                                        if (mirrFilters[index] != null && mirrTargets[index] != null)
                                            tasks.push(new Promise(
                                                function (resolve, reject) {
                                                    var sessionNumber = arrayMax(takenSessionNumbers) + 1;
                                                    var _params = {
                                                        NetworkInterfaceId: netId,
                                                        SessionNumber: sessionNumber,
                                                        TrafficMirrorFilterId: mirrFilters[index],
                                                        TrafficMirrorTargetId: mirrTargets[index],
                                                        Description: "created by automirror",
                                                        TagSpecifications: [
                                                        {
                                                          ResourceType: "traffic-mirror-session",
                                                          Tags: [
                                                            {
                                                              Key: 'Name',
                                                              Value: `AUTOMIRROR > Instance: ${instIds[index]} (Session :${sessionNumber})`
                                                            }
                                                          ]
                                                        }
                                                      ],
                                                    }

                                                    takenSessionNumbers.push(sessionNumber);

                                                    ec2.createTrafficMirrorSession(_params, function (_err, _data) {
                                                        if (_err) {
                                                            console.log(_err);
                                                            reject();
                                                        }
                                                        else {
                                                            console.log(JSON.stringify(_data), null, 2);
                                                            resolve();
                                                        }
                                                    });
                                                }
                                            ))
                                    });
                                    await Promise.all(tasks).then(() => callback(null, 200));
                                }
                            });
                        }
                    });
                }
            });
        }
    })
}

function arrayMax(arr) {

    if (arr.length == 0) return 0;

    return arr.reduce(function (p, v) {
        return (p > v ? p : v);
    });
}