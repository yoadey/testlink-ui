import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import registerServiceWorker from './registerServiceWorker';
import xmlrpc  from 'xmlrpc';
import 'react-sortable-tree/style.css';
import { Grid, Icon } from 'semantic-ui-react';
import TestLinkTree from './TestLinkTree';
import TestLinkMain from './TestLinkMain';


class TestLinkHeader extends React.Component {

  constructor(props) {
    super(props);
    this.state ={
      testlinkClient: xmlrpc.createClient({ path: props.endpoint }),
      devKey: props.devKey,
      username: props.loginId
//      details: '',
//      about: ''
    };
//    this.initialiseUser();
  }

  initialiseUser() {
    this.state.testlinkClient.methodCall('tl.getUserByLogin', [{
        "devKey" : this.state.devKey,
        "user" : this.state.username
      }], (error, value) => {

      var roleName = value.tprojectRoles.name;
      this.setState({
        details: roleName
      });
    });
  }


  render() {
    return (
      <Grid>
        <Grid.Row columns="2">
          <Grid.Column>
            <img src='/testlink/gui/themes/default/images/tl-logo-transparent-12.5.png'/>
            <Icon name='user circle outline' color='blue' size='big'/>
            {this.state.username}
          </Grid.Column>
          <Grid.Column>
            <Icon name='user cancel' color='red' size='big'/>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

class TestLinkLayout extends React.Component {

  constructor(props) {
    super(props);
    this.state ={
      testlinkClient: xmlrpc.createClient({ path: '/testlink/lib/api/xmlrpc/v1/xmlrpc.php' }),
      loginId: 'user.name', //Should be set by login window later
      devKey: 'developerKey' // Should be retrieved by html parsing the userdetails page. Currently has to be set manually
    };
  }

  updateMainWindow(props) {
    this.setState({
      selectedType: props.type,
      selectedId: props.id,
      selectedPath: props.path
    })
  }

  render() {
    return (
      <div style={{width: '100%', overflow: 'hidden'}}>
      <div style={{width: '100%'}}>
        <TestLinkHeader
            testlinkClient={this.state.testlinkClient}
            devKey={this.state.devKey}
            loginId={this.state.loginId} />
      </div>
      <div style={{float: 'left', width: '400px'}}>
        <TestLinkTree
          testlinkClient={this.state.testlinkClient}
          devKey={this.state.devKey}
          onSelect={(type, id) => this.updateMainWindow(type, id)}/>
      </div>
      <div>
        <TestLinkMain
          testlinkClient={this.state.testlinkClient}
          devKey={this.state.devKey}
          type={this.state.selectedType}
          id={this.state.selectedId}
          path={this.state.selectedPath}/>
      </div>
      </div>
    );
  }
}
// ========================================

ReactDOM.render(
  <TestLinkLayout/>,
  document.getElementById('root')
);
