import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import { Table, Grid, Loader, Header } from 'semantic-ui-react';
import { Editor } from '@tinymce/tinymce-react';
import 'tinymce/themes/modern/theme';

// Any plugins you want to use has to be imported
import 'tinymce/plugins/paste';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/textcolor';
import 'tinymce/plugins/image';
import 'tinymce/plugins/table';

class TestCaseView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loadedId: null,
      isLoading: false
    }
  }

  componentWillReceiveProps(){
    this.loadTestCase();
  }

  componentDidMount(){
    this.loadTestCase();
  }

  loadTestCase() {
    if(this.state.loadedId === this.props.id || this.state.isLoading) {
      return;
    }

    this.setState({
      isLoading: true
    })
    this.props.testlinkClient.methodCall('tl.getTestCase', [{
        "devKey" : this.props.devKey,
        "testcaseid" : this.props.id,
        "testprojectid" : this.props.projectId
      }], (error, value) => {
        if(value) {
          this.setState({
            error: null,
            testcase: value[0],
            loadedId: this.props.id,
            isLoading: false
          });
        } else {
          this.setState({
            error: error,
            testcase: null,
            loadedId: this.props.id,
            isLoading: false
          });
        }
      }
    );
  }

  createMarkup(html) {
    return {__html: html};
  }

  editField({step, index}) {
    this.setState({
      editstep: step
    });
  }

  updateStep(type, index, evt) {
    var newContent = evt.target.getContent();
    var stepCopy = Object.assign({}, this.state.editstep);
    if(type === 'actions') {
      stepCopy.actions = newContent;
    } else if(type === 'expected_results') {
      stepCopy.expected_results = newContent;
    }

    var updatedTestCase = Object.assign({}, this.state.testcase);
    updatedTestCase.steps[index] = stepCopy;
    this.setState({
      testcase: updatedTestCase,
      editstep: stepCopy
    })
  }

  render() {
    var description = <Grid.Row/>;
    var steps = [];
    if(this.state.loadedId === this.props.id && this.state.testcase) {
      description = (
        <Grid.Row>
          <Grid.Column>
            <Header as='h1'>{this.state.testcase.name}</Header>
          </Grid.Column>
        </Grid.Row>
      );
      for(var i in this.state.testcase.steps) {
        const step = this.state.testcase.steps[i];
        const index = i;
        if(step == this.state.editstep) {
          steps.push(
            <Table.Row columns={3}>
              <Table.Cell>#{step.step_number}</Table.Cell>
              <Table.Cell>
                <Editor
                  initialValue={step.actions}
                  init={{
                    menubar:false,
                    statusbar: false,
                    height: '200px',
                    plugins: 'autolink link image lists print preview table',
                    toolbar: 'undo redo | bold italic forecolor | alignleft aligncenter alignright | image table'
                  }}
                  onChange={(evt) => this.updateStep('actions', index, evt)}
                />
              </Table.Cell>
              <Table.Cell>
                <Editor
                  initialValue={step.expected_results}
                  init={{
                    menubar:false,
                    statusbar: false,
                    height: '200px',
                    plugins: 'autolink link image lists print preview table',
                    toolbar: 'undo redo | bold italic forecolor | alignleft aligncenter alignright | image table'
                  }}
                  onChange={(evt) => this.updateStep('expected_results', index, evt)}
                  />
              </Table.Cell>
            </Table.Row>
          );
        }
        else {
          steps.push(
            <Table.Row columns={3}>
              <Table.Cell>#{step.step_number}</Table.Cell>
              <Table.Cell>
                <div
                  dangerouslySetInnerHTML={this.createMarkup(step.actions)}
                  onClick={() => this.editField({ step: step,
                    index: index})}/>
              </Table.Cell>
              <Table.Cell>
                <div
                  dangerouslySetInnerHTML={this.createMarkup(step.expected_results)}
                  onClick={() => this.editField({ step: step,
                    index: index})}/>
              </Table.Cell>
            </Table.Row>
          );
        }
      }
    }
    return (
      <div>
        <Loader active={this.state.loadedId !== this.props.id} />
        <Grid divided='vertically'>
          {description}
          <Grid.Row>
            <Table className='testCaseMainTable'>
              <Table.Header>
                <Table.Row>
                  <Table.Cell className='testCaseMainStep'>Step</Table.Cell>
                  <Table.Cell className='testCaseMainAction'>Action</Table.Cell>
                  <Table.Cell className='testCaseMainExpectedResult'>Expected Result</Table.Cell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {steps}
              </Table.Body>
            </Table>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

class TestLinkMain extends React.Component {

  render() {
    var mainElement = <div>Hello World</div>;
    if(this.props.type === 'test_case') {
      var projectId = this.props.path[0].id;
      mainElement = <TestCaseView
          testlinkClient={this.props.testlinkClient}
          devKey={this.props.devKey}
          id={this.props.id}
          projectId={projectId}/>;
    }
    return (
      mainElement
    );
  }
}

export default TestLinkMain;
