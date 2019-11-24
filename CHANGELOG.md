# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.4] - 2019-11-24
### Added
- Added LoadBalancing features - [Closes #3](https://github.com/3CORESec/AWS-AutoMirror/issues/3)
- Added automatic Mirror Filter creation - [Closes #7](https://github.com/3CORESec/AWS-AutoMirror/issues/7)
### Changed
- IAM Policy changed to accomodate the new feature.

## [0.3] - 2019-11-14
### Added
- Logic to transform to lowercase. Tags are no longer case sensitive - [Closes #5](https://github.com/3CORESec/AWS-AutoMirror/issues/5)
- Total number of sessions are now counted and reported on log structure - [Closes #2](https://github.com/3CORESec/AWS-AutoMirror/issues/2)
### Changed
- AWS Lambda Concurrency changed to 1 - [Closes #6](https://github.com/3CORESec/AWS-AutoMirror/issues/6)

## [0.2] - 2019-11-04
### Added
- Mirror Sessions are now named after the EC2 instance for which the mirror session was created - [Closes #4](https://github.com/3CORESec/AWS-AutoMirror/issues/4)
### Changed
- IAM policy was changed to allow the creation of Tags, which are used to name the mirror sessions

## [0.1] - 2019-10-30
### Added
- First release
