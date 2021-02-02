import React from 'react'
import { Grommet, Box, Header, Heading, Button, Tabs, Tab, Stack, Diagram, ResponsiveContext } from 'grommet'
import { Connect, StatusGoodSmall, Trigger, Wifi, Info, Gamepad, DocumentTest, Configure, Close } from 'grommet-icons'
import Rover from './Rover'
import { RoverTheme } from './theme'
import { StateBox, MovingGraph, StyledCard } from './CommonUI'
import './App.css';


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      rover: null,
      connected: false,
      roverState: {},
      roverIMU: {}
    };
    this.handleConnectClick = this.handleConnectClick.bind(this);
    this.handleDisconnectClick = this.handleDisconnectClick.bind(this);
    this.handleSimulate = this.handleSimulate.bind(this);
  }

  componentDidMount() {
    this.setState({ ...this.state, rover: new Rover() });
  }

  componentWillUnmount() {
    this.disconnectRover()
  }

  handleConnectClick(e) {
    e.preventDefault();
    this.state.rover.request()
      .then(_ => this.state.rover.connect())
      .then((bluetoothRemoteGATTServer) => { /* Do something with rover... */
        console.log(this.state.rover.getDevice());
        this.state.rover.getDevice().addEventListener('gattserverdisconnected', _ => {
          this.setState({ ...this.state, connected: false, roverState: {}, roverIMU: {} });
        });
        this.state.rover.startTxNotifications((event) => {
          this.handleUARTTX(event)
        });
        this.setState({ ...this.state, connected: true });
      })
      .catch(error => {
        console.log(error);
        this.setState({ ...this.state, connected: false });
      });
  }

  trimMovingData(workingData) {
    if (workingData.length > 10) {
      workingData = workingData.slice(workingData.length - 10);
    }
    return workingData;
  }

  handleSimulate(e) {
    // Helper for whatever I'm working on
    let value = "12.5;13.5;5.3".split(";")
    if (value.length === 3) {
      let currentTime = new Date().toLocaleTimeString();
      let workingData;
      if (this.state.roverIMU.accel !== undefined) {
        workingData = [...this.state.roverIMU.accel, { "time": currentTime, "X": parseFloat(value[0]), "Y": parseFloat(value[1]), "Z": parseFloat(value[2]) }];
        // Remove extra values
        workingData = this.trimMovingData(workingData);
      } else {
        workingData = Array(10).fill({ "time": currentTime, "X": parseFloat(value[0]), "Y": parseFloat(value[1]), "Z": parseFloat(value[2]) });
      }
      // Save data back to state
      this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, accel: workingData } });
    }
  }

  handleUARTTX(event) {
    let message = new Uint8Array(event.target.value.buffer);
    //console.log(">" + String.fromCharCode.apply(null, message));

    if (message.length > 1) {
      switch (message[0]) {
        case 0xA1:
          // Status
          this.setState({ ...this.state, roverState: { ...this.state.roverState, status: message[1] } });
          break;
        case 0xA2:
          // Voltage
          this.setState({ ...this.state, roverState: { ...this.state.roverState, voltage: String.fromCharCode.apply(null, message.slice(1)) } });
          break;
        case 0xB1:
          // Accelerometer
          // Parse value
          let accelValue = String.fromCharCode.apply(null, message.slice(1)).split(";");
          if (accelValue.length === 3) {
            let currentTime = new Date().toLocaleTimeString();
            let workingData;
            if (this.state.roverIMU.accel !== undefined) {
              workingData = [...this.state.roverIMU.accel, { "time": currentTime, "X": parseFloat(accelValue[0]), "Y": parseFloat(accelValue[1]), "Z": parseFloat(accelValue[2]) }];
              // Remove extra values
              workingData = this.trimMovingData(workingData);
            } else {
              workingData = Array(9).fill({ "time": currentTime, "X": 0, "Y": 0, "Z": 0 });
              workingData = [...workingData, { "time": currentTime, "X": parseFloat(accelValue[0]), "Y": parseFloat(accelValue[1]), "Z": parseFloat(accelValue[2]) }];
            }
            // Save data back to state
            this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, accel: workingData } });
          } else {
            console.log("Invalid number of accel coordinates recieved");
          }
          break;
        case 0xB2:
          // Gyroscope
          // Parse value
          let gyroValue = String.fromCharCode.apply(null, message.slice(1)).split(";");
          if (gyroValue.length === 3) {
            let currentTime = new Date().toLocaleTimeString();
            let workingData;
            if (this.state.roverIMU.gyro !== undefined) {
              workingData = [...this.state.roverIMU.gyro, { "time": currentTime, "X": parseFloat(gyroValue[0]), "Y": parseFloat(gyroValue[1]), "Z": parseFloat(gyroValue[2]) }];
              // Remove extra values
              workingData = this.trimMovingData(workingData);
            } else {
              workingData = Array(9).fill({ "time": currentTime, "X": 0, "Y": 0, "Z": 0 });
              workingData = [...workingData, { "time": currentTime, "X": parseFloat(gyroValue[0]), "Y": parseFloat(gyroValue[1]), "Z": parseFloat(gyroValue[2]) }];
            }
            // Save data back to state
            this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, gyro: workingData } });
          } else {
            console.log("Invalid number of gyro coordinates recieved");
          }
          break;
        case 0xB3:
          // Magnetometer 
          // Parse value
          let fieldValue = String.fromCharCode.apply(null, message.slice(1)).split(";");
          if (fieldValue.length === 3) {
            let currentTime = new Date().toLocaleTimeString();
            let workingData;
            if (this.state.roverIMU.field !== undefined) {
              workingData = [...this.state.roverIMU.field, { "time": currentTime, "X": parseFloat(fieldValue[0]), "Y": parseFloat(fieldValue[1]), "Z": parseFloat(fieldValue[2]) }];
              // Remove extra values
              workingData = this.trimMovingData(workingData);
            } else {
              workingData = Array(9).fill({ "time": currentTime, "X": 0, "Y": 0, "Z": 0 });
              workingData = [...workingData, { "time": currentTime, "X": parseFloat(fieldValue[0]), "Y": parseFloat(fieldValue[1]), "Z": parseFloat(fieldValue[2]) }];
            }
            // Save data back to state
            this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, field: workingData } });
          } else {
            console.log("Invalid number of field coordinates recieved");
          }
          break;
        default:
          console.log("Unknown Message: " + String.fromCharCode.apply(null, message));
      }
    }
  }

  disconnectRover() {
    if (this.state.connected === true) {
      this.state.rover.disconnect();
    }
    this.setState({ ...this.state, connected: false, roverState: {}, roverIMU: {} });
  }

  handleDisconnectClick(e) {
    e.preventDefault();
    this.state.rover.disconnect();
    this.setState({ ...this.state, connected: false, roverState: {}, roverIMU: {} });
  }
  render() {
    let statusColor = "status-unknown";
    let statusMessage = "UNKNOWN";
    switch (this.state.roverState.status) {
      case 0:
        statusColor = "status-ok";
        statusMessage = "IDLE - SAFE TO APPROACH";
        break;
      case 1:
        statusColor = "status-warning";
        statusMessage = "READY - STAND CLEAR";
        break;
      case 2:
        statusColor = "status-critical";
        statusMessage = "MOTORS POWERED - DO NOT APPROACH";
        break;
      default:
        statusColor = "status-unknown";
        statusMessage = "UNKNOWN";
        break;
    }
    return (
      <Grommet full theme={RoverTheme}>
        <Box fill="vertical" overflow="auto" align="center" flex="grow">
          <Header className="appHeader" align="end" justify="center" gap="medium" background={{ "color": "background-contrast" }} fill="horizontal">
            <Box className="appHeaderBox" align="center" direction="row" flex="grow" justify="around" wrap="reverse">
              <Box align="center" justify="center" direction="column" pad="medium" gap="small">
                <ResponsiveContext.Consumer>
                  {size => (size !== "small" && size !== "xsmall" &&
                    <Heading level="2" margin="none" textAlign="start">
                      {this.state.connected ? "Connected" : "Not Connected"}
                    </Heading>
                  )}
                </ResponsiveContext.Consumer>
                {this.state.connected ? <Button label="Disconnect" onClick={this.handleDisconnectClick} icon={<Close />} disabled={false} primary /> : <Button label="Connect" onClick={this.handleConnectClick} icon={<Connect />} disabled={false} primary />}
              </Box>
              <Box justify="center" direction="row" pad="medium" gap="medium">
                <Box align="end" justify="center" direction="column">
                  <Heading level="3" margin="none" textAlign="start">
                    {this.state.connected ? this.state.rover.getDevice().name : "-"}
                  </Heading>
                  <Heading level="4" margin="none" textAlign="start">
                    {statusMessage}
                  </Heading>
                </Box>
                <StatusGoodSmall color={statusColor} size="large" />
              </Box>
            </Box>
          </Header>
          <Box className="box_Content">
            <Tabs justify="center" margin={{ "top": "none", "bottom": "medium", "left": "small", "right": "small" }} flex>
              <Tab title="Status" icon={<Info />}>
                <Box justify="center" className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" fill hoverIndicator={false}>
                  <StyledCard title="System" >
                    <StateBox icon={<Trigger size="medium" />} name="Battery" unit="V" value={this.state.roverState.voltage ? this.state.roverState.voltage : "-"} />
                    <StateBox icon={<Wifi size="medium" />} name="Signal Strength" value={this.state.connected ? "Medium" : "-"} />
                  </StyledCard>
                  <StyledCard wide title="Acceleration" foottext={!(this.state.roverIMU.accel) && "waiting for data"}>
                    {this.state.roverIMU.gyro && (<>
                      <Box align="center" justify="center">
                        <MovingGraph data={this.state.roverIMU.accel} unit="m/s2" />
                      </Box>
                    </>)}
                  </StyledCard>
                  <StyledCard wide title="Angular velocity" foottext={!(this.state.roverIMU.gyro) && "waiting for data"}>
                    {this.state.roverIMU.gyro && (<>
                      <Box align="center" justify="center">
                        <MovingGraph data={this.state.roverIMU.gyro} unit="°/s" />
                      </Box>
                    </>)}
                  </StyledCard>
                  <StyledCard wide title="Magnetic field" foottext={!(this.state.roverIMU.field) && "waiting for data"}>
                    {this.state.roverIMU.field && (<>
                      <Box align="center" justify="center">
                        <MovingGraph data={this.state.roverIMU.field} unit="G" />
                      </Box>
                    </>)}
                  </StyledCard>
                </Box>
              </Tab>
              <Tab title="Drive" icon={<Gamepad />} >
                <Box justify="center" className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" fill hoverIndicator={false}>
                  <StyledCard foottext={this.state.connected ? "Error: right front controller - low voltage" : ""}>
                    <Box align="center" justify="center" margin={{ "bottom": "small" }}>
                      <Stack guidingChild={1}>
                        <Diagram
                          connections={[
                            {
                              fromTarget: '1',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.connected ? "accent-4" : "status-unknown",
                              type: 'curved',
                            },
                            {
                              fromTarget: '2',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.connected ? "status-warning" : "status-unknown",
                              type: 'curved',
                            },
                            {
                              fromTarget: '3',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.connected ? "accent-4" : "status-unknown",
                              type: 'curved',
                            },
                            {
                              fromTarget: '4',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.connected ? "accent-4" : "status-unknown",
                              type: 'curved',
                            }
                          ]}
                        />
                        <Box>
                          <Box direction="row">
                            <Box id="1" margin="small" pad="medium" background={this.state.connected ? "status-ok" : "status-unknown"} />
                            <Box id="5" margin="small" pad="medium" background="none" />
                            <Box id="2" margin="small" pad="medium" background={this.state.connected ? "status-critical" : "status-unknown"} />
                          </Box>
                          <Box direction="row" justify="center">
                            <Box id="0" margin="small" pad="medium" background="#313131"><Trigger size="medium" color={this.state.connected ? "brand" : "status-unknown"} /></Box>
                          </Box>
                          <Box direction="row">
                            <Box id="3" margin="small" pad="medium" background={this.state.connected ? "status-ok" : "status-unknown"} />
                            <Box id="8" margin="small" pad="medium" background="none" />
                            <Box id="4" margin="small" pad="medium" background={this.state.connected ? "status-ok" : "status-unknown"} />
                          </Box>
                        </Box>
                      </Stack>
                    </Box>
                  </StyledCard>

                </Box>
              </Tab>
              <Tab title="Collect Data" icon={<DocumentTest />} />
              <Tab title="Settings" plain={false} disabled={false} icon={<Configure />}>
                <Box justify="center" className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" fill hoverIndicator={false}>
                  <StyledCard wide title="General" foottext="Nothing here yet" />
                </Box>
              </Tab>
            </Tabs>
          </Box>
        </Box>
      </Grommet>
    )
  }
}

export default App;