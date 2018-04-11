import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import { Loader, Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react'

class TestLinkLogin extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      test: 'Hello World',
      user: undefined,
      password: undefined,
      loginRunning: false,
      loginFailed: false
    };
    this.checkAlreadyLoggedIn();
  }

  checkAlreadyLoggedIn() {
    var loginId = localStorage.getItem('testlink.loginId');
    var devKey = localStorage.getItem('testlink.devKey');

    if(loginId && devKey) {
      this.props.onLogin({devKey:devKey, loginId: loginId});
    }
  }

  login() {
    this.setState({
      loginFailed: false,
      loginRunning: true
    });
    var formBody = [];
    formBody.push(encodeURIComponent('tl_login') + "=" + encodeURIComponent(this.state.user));
    formBody.push(encodeURIComponent('tl_password') + "=" + encodeURIComponent(this.state.password));
    formBody = formBody.join("&");

    fetch('testlink/login.php', {
      method: 'POST',
      headers: {
        'Content-Type':	'application/x-www-form-urlencoded'
      },
      credentials: 'same-origin',
      body: formBody
    }).then((response) => {
      return response.text();
    }).then((data) => {
      if(! data.includes("index.php?caller=login") && ! data.includes("There is still a valid login for your browser")) {
          this.setState({
            loginFailed: true,
            loginRunning: false
          });
          return;
      }
      fetch('testlink/lib/usermanagement/userInfo.php', {
        credentials: 'same-origin'
      }).then((response) => {
        return response.text();
      }).then((data) => {
        var apiKeyPattern = /\<p\>Personal API access key = ([\w\d]+)\<\/p\>/g;
        var devKey = apiKeyPattern.exec(data);
        if(this.props.onLogin) {
          this.props.onLogin({devKey: devKey[1], loginId: this.state.user});
          localStorage.setItem('testlink.loginId', this.state.user);
          localStorage.setItem('testlink.devKey', devKey[1]);
        }
      });
    });
  }

  render() {
    return (<div className='login-form'>
    <style>{`
      body > div,
      body > div > div,
      body > div > div > div.login-form {
        height: 100%;
      }
    `}</style>
    <Grid
      textAlign='center'
      style={{ height: '100%' }}
      verticalAlign='middle'
    >
      <Grid.Column style={{ maxWidth: 450 }}>
        <Loader active={this.state.loginRunning} />
        <Header as='h2' color='blue' textAlign='center'>
          <Image src='/testlink/gui/themes/default/images/tl-logo-transparent-12.5.png' style={{width: 'auto'}} />
          {' '}Log-in to your account
        </Header>
        <Form size='large'>
          <Segment stacked>
            <Form.Input
              fluid
              icon='user'
              iconPosition='left'
              placeholder='E-mail address'
              onChange={(e, { value }) => this.setState({user: value})}
            />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder='Password'
              type='password'
              onChange={(e, { value }) => this.setState({password: value})}
            />

            <Button color='blue' fluid size='large' onClick={() => this.login()}>Login</Button>
          </Segment>
        </Form>
        <Message>
          New to TestLink? <a href='#'>Sign Up</a>
        </Message>
        <Message negative hidden={!this.state.loginFailed}>
          Login failed: either user or password is wrong
        </Message>
      </Grid.Column>
    </Grid>
  </div>
)
  }
}

export default TestLinkLogin;
