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
import TestLinkHeader from './TestLinkHeader';
import TestLinkLogin from './TestLinkLogin';

class TestLinkLayout extends React.Component {

  constructor(props) {
    super(props);
    this.state ={
      testlinkClient: xmlrpc.createClient({ path: '/testlink/lib/api/xmlrpc/v1/xmlrpc.php' })
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
    var layout;
    if(! this.state.devKey) {
      layout = (<TestLinkLogin
         onLogin={({devKey, loginId}) => this.setState({devKey: devKey, loginId: loginId})}>
         </TestLinkLogin>);
    }
    else {
      layout = (
        <div style={{width: '100%', overflow: 'hidden'}}>
          <div style={{width: '100%'}}>
            <TestLinkHeader
                testlinkClient={this.state.testlinkClient}
                devKey={this.state.devKey}
                loginId={this.state.loginId}
                onLogout={() => this.setState({devKey: undefined, loginId: undefined })} />
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
      )
    }
    return layout;
  }
}
// ========================================

ReactDOM.render(
  <TestLinkLayout/>,
  document.getElementById('root')
);
