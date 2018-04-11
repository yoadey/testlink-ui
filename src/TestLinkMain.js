import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import { Table, Grid, Loader, Header, Icon, Button } from 'semantic-ui-react';
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

  componentWillReceiveProps() {
    this.loadTestCase();
  }

  componentDidMount() {
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

  editField({focus, step, index}) {
    this.setState({
      focus: focus,
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
      editstep: stepCopy,
      focus: undefined
    })
  }

  addStep(index) {
    var updatedTestCase = Object.assign({}, this.state.testcase);
    var steps = Object.assign([], updatedTestCase.steps);
    var newStep = {
      actions: "",
      active: "1",
      execution_type: "1",
      expected_results: "",
      step_number: index
    }
    index = parseInt(index);
    steps.splice(index+1, 0, newStep);
    for(var i = 0; i < steps.length; i++) {
      steps[i].step_number = i + 1;
    }
    updatedTestCase.steps = steps;
    this.setState({
      testcase: updatedTestCase
    })
  }

  removeStep(index) {
      var updatedTestCase = Object.assign({}, this.state.testcase);
      var steps = updatedTestCase.steps;
      steps.splice(index, 1);
      updatedTestCase.steps = steps;
      this.setState({
        testcase: updatedTestCase
      })
  }

  saveTestCase() {
    var testcaseTO = this.convertTestCase(this.state.testcase);
    testcaseTO.devKey = this.props.devKey;

    this.setState({
      isLoading: true
    })
    this.props.testlinkClient.methodCall('tl.updateTestCase', [testcaseTO],
        (error, value) => {
        if(error) {
          this.setState({
            error: error,
            loadedId: this.props.id,
            isLoading: false
          });
        }else {
          this.loadTestCase();
        }
      }
    );
  }

  convertTestCase(testcase) {
    var stepsTO = this.convertSteps(testcase.steps);

    var testcaseTO = {
      testcasename: testcase.name,
      testsuiteid: testcase.testsuite_id,
      testprojectid: this.props.projectId,
      authorlogin: testcase.author_login,
      summary: testcase.summary,
      steps: stepsTO,
      preconditions: testcase.preconditions,
      status: testcase.status,
      importance: testcase.importance,
      executiontype: testcase.execution_type,
      order: testcase.node_order,
      testcaseexternalid: testcase.full_tc_external_id,
      checkduplicatedname: null,
      actiononduplicatedname: null
    }

    return testcaseTO;
  }

  convertSteps(steps) {
    var stepsTO = [];

    for(var i in steps) {
      var step = steps[i];
      var stepTO = {
        step_number: step.step_number,
        actions: step.actions,
        expected_results: step.expected_results,
        execution_type: step.execution_type
      }
      stepsTO.push(stepTO);
    }

    return stepsTO;
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
        var actionsFocus = undefined;
        var expectedResultsFocus = undefined;
        if(this.state.focus === "actions") {
          actionsFocus = function (editor) { editor.on('init', function () { editor.focus(); }); };
        } else if(this.state.focus === "expected_results") {
          expectedResultsFocus = function (editor) { editor.on('init', function () { editor.focus(); }); };
        }
        if(step == this.state.editstep) {
          steps.push(
            <Table.Row columns={3}>
              <Table.Cell>
                #{step.step_number}<br/>
                <Icon name="plus circle" color="green" onClick={(evt) => this.addStep(index)}/>
                <Icon name="minus circle" color="red" onClick={(evt) => this.removeStep(index)}/>
              </Table.Cell>
              <Table.Cell>
                <Editor
                  initialValue={step.actions}
                  init={{
                    setup: actionsFocus,
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
                    setup: expectedResultsFocus,
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
              <Table.Cell>
                #{step.step_number}<br/>
                <Icon name="plus circle" color="green" onClick={(evt) => this.addStep(index)}/>
                <Icon name="minus circle" color="red" onClick={(evt) => this.removeStep(index)}/>
              </Table.Cell>
              <Table.Cell
                  onClick={() => this.editField({ focus: "actions", step: step, index: index})}
                  selectable>
                <a href="#" onFocus={() => this.editField({ focus: "actions", step: step, index: index})}>
                  <div dangerouslySetInnerHTML={this.createMarkup(step.actions)} />
                </a>
              </Table.Cell>
              <Table.Cell
                  onClick={() => this.editField({ focus: "expected_results", step: step, index: index})}
                  selectable>
                <a href="#" onFocus={() => this.editField({ focus: "expected_results", step: step, index: index})}>
                  <div dangerouslySetInnerHTML={this.createMarkup(step.expected_results)} />
                </a>
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
              <Table.Footer>
                <Table.Row>
                  <Table.Cell columns={3}><Button content="Save" icon="save" onClick={(evt) => this.saveTestCase()}/></Table.Cell>
                </Table.Row>
              </Table.Footer>
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
      var projectId = this.props.path[0];
      projectId = projectId.split("_")[1];
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
