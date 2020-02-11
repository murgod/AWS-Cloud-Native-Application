import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';

import Recipe from './Recipe';
import Register from './Register';

const style = {
  margin: 15,
};

class Recipesscreen extends Component {
  constructor(props){
    super(props);
    var loginButtons=[];
    loginButtons.push(
      <div key={"Login-Div"}>
      <MuiThemeProvider>
        <div>
           <RaisedButton label={"Register"} primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
       </div>
       </MuiThemeProvider>
      </div>
    )
    this.state={
      username:'',
      password:'',
      recipesscreen:[],
      loginmessage:'',
      loginButtons:loginButtons,
      isLogin:true
    }
  }
  componentWillMount(){
    var recipesscreen=[];
    recipesscreen.push(<Recipe parentContext={this} appContext={this.props.appContext} key={"RecipesScreen"}/>);
    var loginmessage = "Not registered yet, Register Now";
    this.setState({
      recipesscreen:recipesscreen,
                  loginmessage:loginmessage
                    })
  }
  handleClick(event){
    console.log("event");
    var loginmessage;
    if(this.state.isLogin){
      let recipesscreen=[];
      recipesscreen.push(<Register parentContext={this} appContext={this.props.appContext} />);
      loginmessage = "To Register/Login";
      let loginButtons=[];
      loginButtons.push(
        <div key="login-button">
        <MuiThemeProvider>
          <div>
             <RaisedButton label={"Login"} primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
         </div>
         </MuiThemeProvider>
        </div>
      )
      this.setState({
        recipesscreen:recipesscreen,
                     loginmessage:loginmessage,
                     loginButtons:loginButtons,
                     isLogin:false
                   })
    }
    else{
      let recipesscreen=[],loginButtons=[];
      loginButtons.push(
        <div>
        <MuiThemeProvider>
          <div>
             <RaisedButton label={"Register"} primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
         </div>
         </MuiThemeProvider>
        </div>
      )
      Recipesscreen.push(<Recipe parentContext={this} appContext={this.props.appContext} />);
      loginmessage = "To Register/Login";
      this.setState({
                     recipesscreen:recipesscreen,
                     loginmessage:loginmessage
                   })
    }
  }
  render() {
    return (
      <div className="recipesscreen" key="recipesscreen">
        {this.state.recipesscreen}
        <div>
          {this.state.loginmessage}
          {this.state.loginButtons}
        </div>
      </div>
    );
  }
}


export default Recipesscreen;
