var aws = require('aws-sdk');
var ec2 = new aws.EC2();

exports.handler = async function (event) {

  var params = {
    Filters: [{
      Name: "tag:Mirror",
      Values: ["true", "True"]
    }]
  };

  var altParams = {
    Filters: [{
      Name: "tag:mirror",
      Values: ["true", "True"]
    }]
  };

  await ec2.describeTrafficMirrorSessions().promise()
    .then(sessionInfo => ec2.describeInstances(params).promise()
      .then(data => ec2.describeInstances(altParams).promise()
        .then(altData => ec2.describeTrafficMirrorTargets().promise()
          .then(mirrTargetData => generateMirrorFilter()
            .then(mirrFilterData => {

              var _sessionInfo = sessionInfo.TrafficMirrorSessions;
              var sessionCount = _sessionInfo.length;
              var tasks = [];
              var netIds = [];
              var instIds = [];
              var mirrFilters = [];
              var mirrTargets = [];
              var usedSessionInfo = null;
              var masterMirrTarget = null;
              var masterMirrFilter = null;

              data.Reservations = data.Reservations.concat(altData.Reservations);

              try {
                usedSessionInfo = _sessionInfo
                  .map(sess => {
                    return {
                      NetworkInterfaceId: sess.NetworkInterfaceId,
                      TrafficMirrorTargetId: sess.TrafficMirrorTargetId,
                      TrafficMirrorFilterId: sess.TrafficMirrorFilterId,
                      SessionNumber: sess.SessionNumber
                    }
                  });
              } catch (err) {
                usedSessionInfo = []
              }

              var targetCountMap = [];

              var count = 0;

              mirrTargetData.TrafficMirrorTargets.forEach(x => { targetCountMap[count++] = { TrafficMirrorTargetId: x.TrafficMirrorTargetId, count: 0 } });

              usedSessionInfo.forEach(x => {
                var index = targetCountMap.findIndex(y => y.TrafficMirrorTargetId == x.TrafficMirrorTargetId);
                targetCountMap[index].count++;
              });

              if (mirrTargetData.TrafficMirrorTargets && mirrTargetData.TrafficMirrorTargets.length > 0) {
                masterMirrTarget = targetCountMap.reduce(function (prev, current) {
                  return (prev.count < current.count) ? prev : current
                }).TrafficMirrorTargetId;
              }

              if (mirrFilterData.TrafficMirrorFilters && mirrFilterData.TrafficMirrorFilters.length > 0)
                masterMirrFilter = mirrFilterData
                  .TrafficMirrorFilters[mirrFilterData.TrafficMirrorFilters.length - 1].TrafficMirrorFilterId;

              data
                .Reservations.forEach(res =>
                  res.Instances.forEach(inst => {
                    var target = masterMirrTarget;

                    console.log('\n------------\n', targetCountMap, '\n------------\n');


                    if (mirrTargetData.TrafficMirrorTargets && mirrTargetData.TrafficMirrorTargets.length > 0) {
                      masterMirrTarget = targetCountMap.reduce(function (prev, current) {
                        return (prev.count < current.count) ? prev : current
                      }).TrafficMirrorTargetId;
                    }

                    var filter = masterMirrFilter;

                    if (inst.Tags.map(x => x.Key.toLowerCase()).includes('mirror-target')) {
                      target = inst
                        .Tags[inst.Tags.map(x => x.Key.toLowerCase()).indexOf('mirror-target')]
                        .Value;
                    }

                    if (inst.Tags.map(x => x.Key.toLowerCase()).includes('mirror-filter'))
                      filter = inst
                        .Tags[inst.Tags.map(x => x.Key.toLowerCase()).indexOf('mirror-filter')]
                        .Value;

                    if (inst.NetworkInterfaces != null &&
                      inst.NetworkInterfaces.length > 0 &&
                      usedSessionInfo.filter(x => x.NetworkInterfaceId == inst.NetworkInterfaces[0].NetworkInterfaceId).length < 3 &&
                      !usedSessionInfo.find(x =>
                        x.TrafficMirrorTargetId == target &&
                        x.TrafficMirrorFilterId == filter &&
                        x.NetworkInterfaceId == inst.NetworkInterfaces[0].NetworkInterfaceId
                      ) &&
                      !(usedSessionInfo.find(x => x.NetworkInterfaceId == inst.NetworkInterfaces[0].NetworkInterfaceId) && !inst.Tags.map(x => x.Key.toLowerCase()).includes('mirror-target'))
                    ) {
                      var index = targetCountMap.findIndex(y => y.TrafficMirrorTargetId == masterMirrTarget);
                      targetCountMap[index].count++;
                      mirrTargets.push(target);
                      mirrFilters.push(filter);
                      instIds.push(inst.InstanceId);
                      netIds.push(inst.NetworkInterfaces[0].NetworkInterfaceId);
                    }
                  })
                );
              netIds.forEach((netId, index) => {

                if (mirrFilters[index] != null && mirrTargets[index] != null)
                  tasks.push(new Promise(
                    function (resolve, reject) {
                      var sessionNumber = calculateSessionNumber(usedSessionInfo, netId);
                      if (sessionNumber == null)
                        reject(`Interface ${netId} already has 3 sessions`);
                      var _params = {
                        NetworkInterfaceId: netId,
                        SessionNumber: sessionNumber,
                        TrafficMirrorFilterId: mirrFilters[index],
                        TrafficMirrorTargetId: mirrTargets[index],
                        Description: "Created by AutoMirror",
                        TagSpecifications: [{
                          ResourceType: "traffic-mirror-session",
                          Tags: [{
                            Key: 'Name',
                            Value: `${instIds[index]}`
                          }]
                        }]
                      }

                      usedSessionInfo.push({
                        TrafficMirrorFilterId: mirrFilters[index],
                        TrafficMirrorTargetId: mirrTargets[index],
                        NetworkInterfaceId: netId,
                        SessionNumber: sessionNumber
                      });
                      ec2.createTrafficMirrorSession(_params, function (_err, _data) {
                        if (_err) {
                          console.log(JSON.stringify(_err, null, 2));
                          reject();
                        } else {
                          resolve(_data);
                        }
                      });
                    }
                  ))
              });
              return Promise.all(tasks).then((res) => {
                var ret = {
                  results: res,
                  MirrorSessionsCount: sessionCount + res.length
                }
                console.log(JSON.stringify(ret, null, 2));
              });
            })
          )
        )
      )
    )
}

function calculateSessionNumber(arr, source) {
  if (arr.length == 0) return 1;
  arr = arr.sort((a, b) => {
    return a.SessionNumber > b.SessionNumber
  });
  arr = arr.filter(x => x.NetworkInterfaceId == source);
  if (arr.length > 0 && arr.length < 3)
    return arr.pop().SessionNumber + 1;
  //.slice(-1)
  else if (arr.length == 0) return 1;
  else return null;
}

async function generateMirrorFilter() {

  var mirrFilterParams = {
    Description: 'Created by AutoMirror',
    TagSpecifications: [{
      ResourceType: "traffic-mirror-filter",
      Tags: [{
        Key: 'Name',
        Value: 'AutoMirror-AllTraffic'
      }]
    }]
  };

  return await ec2.describeTrafficMirrorFilters().promise()
    .then(data => {
      return new Promise(async (resolve, reject) => {
        var callback = (err, data) => {
          if (err) {
            console.log(JSON.stringify(err, null, 2));
            reject(err);
          }
        };

        if (data.TrafficMirrorFilters.length == 0) {
          await ec2.createTrafficMirrorFilter(mirrFilterParams).promise()
            .then(trafficMirrorFilterData =>
              ec2.createTrafficMirrorFilterRule({
                DestinationCidrBlock: '0.0.0.0/0',
                RuleAction: 'accept',
                RuleNumber: 100,
                SourceCidrBlock: '0.0.0.0/0',
                TrafficDirection: 'ingress',
                TrafficMirrorFilterId: trafficMirrorFilterData.TrafficMirrorFilter.TrafficMirrorFilterId
              }, callback).promise()
                .then(
                  ec2.createTrafficMirrorFilterRule({
                    DestinationCidrBlock: '0.0.0.0/0',
                    RuleAction: 'accept',
                    RuleNumber: 100,
                    SourceCidrBlock: '0.0.0.0/0',
                    TrafficDirection: 'egress',
                    TrafficMirrorFilterId: trafficMirrorFilterData.TrafficMirrorFilter.TrafficMirrorFilterId
                  }, callback).promise()
                    .then(() => {
                      data.TrafficMirrorFilters.push({ TrafficMirrorFilterId: trafficMirrorFilterData.TrafficMirrorFilter.TrafficMirrorFilterId });
                      resolve(data);
                    })
                )
            )
        }
        else resolve(data)
      }
      )
    })
}