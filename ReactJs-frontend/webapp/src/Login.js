import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import axios from 'axios';
import { red100 } from 'material-ui/styles/colors';

import Recipe from './Recipe';

//var apiBaseUrl = "http://localhost:3000/v1/user";
var apiBaseUrl = process.env.REACT_APP_BACKEND_URL+"/v1/user";

class Login extends Component {
  constructor(props){
    super(props);
    var localloginComponent=[];
    localloginComponent.push(
      <MuiThemeProvider key={"theme"}>
        <div>
         <TextField
           hintText="Enter Email"
           floatingLabelText="Email"
           onChange={(event,newValue) => this.setState({username:newValue})}
           />
         <br/>
           <TextField
             type="password"
             hintText="Enter your Password"
             floatingLabelText="Password"
             onChange = {(event,newValue) => this.setState({password:newValue})}
             />
           <br/>
           <RaisedButton label="Submit" primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
           <RaisedButton label="Skip Login" primary={true} style={style} onClick={(event) => this.goToSite(event)}/>
       </div>
       </MuiThemeProvider>
    )
    this.state={
      username:'',
      password:'',
      menuValue:1,
      loginComponent:localloginComponent
      
    }
  }
  componentWillMount(){

      var localloginComponent=[];
      localloginComponent.push(
        <MuiThemeProvider>
          <div>
           <TextField
             hintText="Email Id"
             floatingLabelText="Email Id"
             onChange = {(event,newValue) => this.setState({username:newValue})}
             />
           <br/>
             <TextField
               type="password"
               hintText="Enter your Password"
               floatingLabelText="Password"
               onChange = {(event,newValue) => this.setState({password:newValue})}
               />
             <br/>
             <RaisedButton label="Submit" primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
             <RaisedButton label="Skip Login" primary={true} style={style} onClick={(event) => this.goToSite(event)}/>
         </div>
         </MuiThemeProvider>
      )
      this.setState({menuValue:1,loginComponent:localloginComponent})
    

  }

  goToSite(event){
    console.log("Execution here");
    var self = this;
    var  loginscreen=[];
    loginscreen.push(<Recipe parentContext={this} appContext={self.props.appContext}/>);
    var loginmessage = "To Register/Login";
    self.props.parentContext.setState({ loginscreen: loginscreen,
    loginmessage:loginmessage,
    buttonLabel:"SKip Register",
    isLogin:true
     });

  }
  handleClick(event){
   
    var payload={
      "userid":this.state.username,
	    "password":this.state.password,
    }
    axios.post(apiBaseUrl+'login', payload)
   .then(function (response) {
     console.log(response);
     if(response.data.code === 200){
       console.log("Login successfull");
     }
     else if(response.data.code === 204){
       console.log("Username password do not match");
       alert(response.data.success)
     }
     else{
       console.log("Username does not exists");
       alert("Username does not exist");
     }
   })
   .catch(function (error) {
     console.log(error);
   });
  }

  handleMenuChange(value){
    console.log("menuvalue",value);
    
    if(value===1){
      var localloginComponent=[];
     
      localloginComponent.push(
        <MuiThemeProvider>
          <div>
           <TextField
             hintText="Email"
             floatingLabelText="Email"
             onChange = {(event,newValue) => this.setState({username:newValue})}
             />
           <br/>
             <TextField
               type="password"
               hintText="Enter your Password"
               floatingLabelText="Password"
               onChange = {(event,newValue) => this.setState({password:newValue})}
               />
             <br/>
             <RaisedButton label="Submit" primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
         </div>
         </MuiThemeProvider>
      )
    }
    else if(value === 2){
      var localloginComponent=[];
     
      localloginComponent.push(
        <MuiThemeProvider>
          <div>
           <TextField
             hintText="Email"
             floatingLabelText="Email"
             onChange = {(event,newValue) => this.setState({username:newValue})}
             />
           <br/>
             <TextField
               type="password"
               hintText="Enter your Password"
               floatingLabelText="Password"
               onChange = {(event,newValue) => this.setState({password:newValue})}
               />
             <br/>
             <RaisedButton label="Submit" primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
         </div>
         </MuiThemeProvider>
      )
    }
    this.setState({menuValue:value,
                   loginComponent:localloginComponent})
  }
  render() {
    return (
      <div>
        <MuiThemeProvider>
        <AppBar
             title="Login"
           />
        </MuiThemeProvider>
        {this.state.loginComponent}
        {<h1>apiBaseUrl: {apiBaseUrl}</h1>}
      </div>
    );
  }
}

const style = {
  margin: 15,
};

export default Login;
