import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import axios from 'axios';
import Login from './Login';
import Recipesscreen from './Recipesscreen';
import Recipe from './Recipe';

//var apiBaseUrl = 'http://localhost:5000/v1/user';
var apiBaseUrl = process.env.REACT_APP_BACKEND_URL+"/v1/user";
const formData = new FormData();

class Register extends Component {
  
  constructor(props){
    super(props);
    this.state={
      first_name:'',
      last_name:'',
      email:'',
      password:''
    }
  }
  componentWillReceiveProps(nextProps){
    console.log("nextProps",nextProps);
  }

  goToSite(event) {
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

    var self = this;
    console.log("values in register handler");
  
    //To be done:check for empty values before hitting submit
    if(this.state.first_name.length>0 && this.state.last_name.length>0 && this.state.email.length>0 && this.state.password.length>0){
      var payload={
      "first_name": this.state.first_name,
      "last_name":this.state.last_name,
      "password":this.state.password,
      "email_address":this.state.email
      }

      formData.append('first_name', this.state.first_name);
      formData.append('last_name', this.state.last_name);
      formData.append('password', this.state.password);
      formData.append('email_address', this.state.email);

      (async () => {
        const rawResponse = await fetch(apiBaseUrl, {
          //mode: 'cors',
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            first_name: this.state.first_name,
            last_name: this.state.last_name,
            password : this.state.password,
            email_address: this.state.email
  })
        });
        const content = await rawResponse.json();
      
        console.log(content.response.message);
        console.log(content.response.status);

        if(content.response.message === "User registered successfully"){
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
        else if(content.response.message === "User already exists"){
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
        else {
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
      })();
    }
    else{
      alert("Input field value is missing");
    }

  }
  render() {
    // console.log("props",this.props);

    return (
      <div>
        <MuiThemeProvider>
          <div>
          <AppBar
             title="Register To Our site"
           />
           <TextField
             hintText="First Name"
             floatingLabelText="First Name"
             onChange = {(event,newValue) => this.setState({first_name:newValue})}
             />
           <br/>
           <TextField
             hintText="Last Name"
             floatingLabelText="Last Name"
             onChange = {(event,newValue) => this.setState({last_name:newValue})}
             />
           <br/>
           <TextField
             hintText="Email"
             floatingLabelText="Email"
             onChange = {(event,newValue) => this.setState({email:newValue})}
             />
           <br/>
           <TextField
             type = "password"
             hintText="Enter your Password"
             floatingLabelText="Password"
             onChange = {(event,newValue) => this.setState({password:newValue})}
             />
           <br/>
           <RaisedButton label="Submit" primary={true} style={style} onClick={(event) => this.handleClick(event)}/>
           <RaisedButton label="Skip Registration" primary={true} style={style} onClick={(event) => this.goToSite(event)}/>
          </div>
          {<h1>apiBaseUrl: {apiBaseUrl}</h1>}
         </MuiThemeProvider>
      </div>
    );
  }
}

const style = {
  margin: 15,
};

export default Register;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 