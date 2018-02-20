import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import SortableTree, { addNodeUnderParent, changeNodeAtPath } from 'react-sortable-tree';
import xmlrpc  from 'xmlrpc';
import 'react-sortable-tree/style.css';
import FileExplorerTheme from 'react-sortable-tree-theme-file-explorer';
import { Icon } from 'semantic-ui-react';

class TestLinkTree extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      treeData: [{ title: 'Loading...' }],
    };
    this.initialiseProjects();
  }

  initialiseProjects() {
    this.props.testlinkClient.methodCall('tl.getProjects', [{
        "devKey" : this.props.devKey
      }], (error, value) => {
        var newTree = [];
        for(var i = 0; i < value.length; i++) {
          newTree.push({
            title: (<div><Icon name='dashboard' color='teal'/>{value[i].name}</div>),
            level: 'project',
            id: value[i].id,
            childrenLoaded: false,
            children: [{
              title: 'Loading...',
              id: value[i].id,
              level: 'project_loading'
            }]
          });
        }

        this.setState({
          treeData: newTree
        })
    });
  }

  treeVisibilityChanged (props) {
    // Do not continue, if the children are already loaded or the parent node was not expanded
    if(!props.expanded || props.node.childrenLoaded) {
      return;
    }

    if(props.node.level === 'project') {
      this.expandProjectNode(props);
    }
    else if(props.node.level === 'test_suites_root') {
      this.expandTestSuitesRootNode(props);
    }
    else if(props.node.level === 'test_suite') {
      this.expandTestSuiteNode(props);
    }
  }

  expandProjectNode(props) {
    var projectId = this.getProjectId(props);
    var newTreeData = this.updateLoaded(props);

    var newNodes = [
      {
        title: (<div><Icon name='book' color='brown'/>Requirements</div>),
        level: 'requirements',
        id: projectId
      },
      {
        title: (<div><Icon name='folder open' color='yellow'/>Test Suites</div>),
        level: 'test_suites_root',
        id: projectId
      },
      {
        title: (<div><Icon name='sitemap' color='green'/>Test Plans</div>),
        level: 'test_plans',
        id: projectId
      },
      {
        title: (<div><Icon name='line chart' color='blue' />Test Reports</div>),
        level: 'test_reports',
        id: projectId
      }
    ];

    newTreeData = this.addNodesUnderParent(newTreeData, props.path[props.path.length-1], newNodes);

    this.setState(state => ({
      treeData: newTreeData,
    }));
  }

  expandTestSuiteNode(props) {
    var projectId = this.getProjectId(props);
    var testSuiteId = props.node.id;

    this.props.testlinkClient.methodCall('tl.getTestSuitesForTestSuite', [{
      "devKey" : this.props.devKey,
      "testsuiteid" : testSuiteId,
      "testprojectid" : projectId
    }], (error, value) => {
      var childTestSuites = [];
      for (var k in value){
        if (value.hasOwnProperty(k) && value[k].name) {
          childTestSuites.push({
            title: (<div><Icon name='folder open' color='yellow'/>{value[k].name}</div>),
            level: 'test_suite',
            id: value[k].id
          });
        }
      }

      this.props.testlinkClient.methodCall('tl.getTestCasesForTestSuite', [{
          "devKey" : this.props.devKey,
          "testsuiteid" : testSuiteId,
          "deep" : false,
          "details" : "simple"
        }], (error, value) => {
        var testCases = [];
        for(var i = 0; i < value.length; i++) {
          if(value[i].id) {
            testCases.push({
              title: (<div><Icon name='list' color='green'/>{value[i].name}</div>),
              level: 'test_case',
              id: value[i].id
            });
          }
        }

        var newTreeData = this.updateLoaded(props);
        newTreeData = this.addNodesUnderParent(newTreeData, props.path[props.path.length-1], childTestSuites);
        newTreeData = this.addNodesUnderParent(newTreeData, props.path[props.path.length-1], testCases, false);
        this.setState({
          treeData: newTreeData
        });
      });
    });
  }

  expandTestSuitesRootNode(props) {
    var projectId = this.getProjectId(props);

    this.props.testlinkClient.methodCall('tl.getFirstLevelTestSuitesForTestProject', [{
        "devKey" : this.props.devKey,
        "testprojectid" : projectId
      }], (error, value) => {
        var newNodes = [];
        for(var i = 0; i < value.length; i++) {
          newNodes.push({
            title: (<div><Icon name='folder open' color='yellow'/>{value[i].name}</div>),
            level: 'test_suite',
            id: value[i].id
          });
        }

        var newTreeData = this.updateLoaded(props);
        newTreeData = this.addNodesUnderParent(newTreeData, props.path[props.path.length-1], newNodes);
        this.setState({
          treeData: newTreeData
        })
    });
  }

  getProjectId(props) {
    return this.getNodeAtPath([props.path[0]]).id;
  }

  getNodeAtPath(path) {
    var currentTree = this.state.treeData;
    var nextTree = undefined;
    var result = undefined;
    for(var i in path) {
      for(var k in currentTree) {
        var node = currentTree[k];
        if(this.getNodeKey({node}) === path[i]) {
          if(i < path.length - 1) {
            nextTree = currentTree[k].children;
          } else {
            result = currentTree[k];
          }
          break;
        }
      }
      if(!nextTree && ! result) {
        throw new Error("NODE NOT FOUND");
      }
      currentTree = nextTree;
    }

    if(result === undefined) {
      throw new Error("NODE NOT FOUND");
    }

    return result;
  }

  addNodesUnderParent(treeData, parentKey, newNodes, addChildrenPossible = true) {
        var newTreeData = treeData;

        var getNodeKey = this.getNodeKey;
        for(var i = 0; i < newNodes.length; i++) {
          if(addChildrenPossible) {
            newNodes[i].childrenLoaded = false;
            newNodes[i].children = [{ title: 'Loading...'}];
          }
          newTreeData = addNodeUnderParent({
            treeData: newTreeData,
            parentKey: parentKey,
            expandParent: true,
            getNodeKey,
            newNode: newNodes[i],
          }).treeData;
        }

        return newTreeData;
  }

  updateLoaded(props) {
    var getNodeKey = this.getNodeKey;
    return changeNodeAtPath({
      treeData: props.treeData,
      path: props.path,
      newNode: ({ node, treeIndex }) => {
        node.childrenLoaded = true;
        node.children = undefined;
        return node;
      },
      getNodeKey
    });
  }

  generateNodeProps({node, path}) {
    var className = null;
    if(this.state.selectedType === node.level &&
      this.state.selectedId === node.id) {
      className = 'selectedNode';
    }
    return {
      onClick: () => this.updateSelected({node, path})
    }
  }

  updateSelected({node, path}) {
    this.setState({
      selectedId: node.id,
      selectedType: node.level
    })
    if(this.props.onSelect) {
      var currentLevel = this.state.treeData;
      var nodeType = node.level;
      var nodeId = node.id;
      this.props.onSelect({
        type: nodeType,
        id: nodeId,
        path: path});
    }
  }

  getNodeKey({node}) {
    var nodeTypeVar = node.level;
    var nodeIdVar = node.id;
    return nodeTypeVar + '_' + nodeIdVar ;
  }

  render() {
    return (
      <div style={{ height: 900, width: 400 }}>
        <SortableTree
          treeData={this.state.treeData}
          onChange={treeData => this.setState({ treeData })}
          onVisibilityToggle={(props) => this.treeVisibilityChanged(props)}
          theme={FileExplorerTheme}
          generateNodeProps={rowInfo => this.generateNodeProps(rowInfo)}
          getNodeKey={({node}) => this.getNodeKey({node})}
          canDrag={false}
        />
      </div>
    );
  }
}

export default TestLinkTree;
