import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import registerServiceWorker from './registerServiceWorker';
import xmlrpc  from 'xmlrpc';
import { Grid, Icon } from 'semantic-ui-react';

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

  logout() {
    localStorage.removeItem('testlink.loginId');
    localStorage.removeItem('testlink.devKey');
    this.props.onLogout();
  }

  render() {
    return (
      <Grid>
        <Grid.Row columns="2" color="blue">
          <Grid.Column>
            <img src='/testlink/gui/themes/default/images/tl-logo-transparent-12.5.png'/>
            <Icon name='user circle outline' color='blue' size='big'/>
            {this.state.username}
          </Grid.Column>
          <Grid.Column>
            <Icon name='user cancel' color='red' size='big'
              onClick={() => this.logout()}/>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }

}

export default TestLinkHeader;
