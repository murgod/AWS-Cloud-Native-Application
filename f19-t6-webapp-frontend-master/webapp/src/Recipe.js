import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import axios from 'axios';

//var apiBaseUrl = 'http://localhost:5000/v1/recipe';
var apiBaseUrl = process.env.REACT_APP_BACKEND_URL+"/v1/recipe";

class Recipe extends Component {
  constructor(props){
    super(props);
    var localrecipeComponent=[];
    localrecipeComponent.push(
      <MuiThemeProvider >
        <div>
             <RaisedButton label="next" primary={true} style={style} onClick={(event) => this.goToNext(event)}/>
             <RaisedButton label="previous" primary={true} style={style} onClick={(event) => this.goToPrevious(event)}/>
       </div>
       </MuiThemeProvider>
    )
    this.state={
      'items': [],
      'counter': 0
      
    }
  }
  componentWillMount(){
    var localrecipeComponent=[];
      
    this.state.counter = this.state.counter +1;
      //To be done:check for empty values before hitting submit
      if(1){
        (async () => {
          const rawResponse = await fetch(apiBaseUrl, {
            //mode: 'cors',
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
  
          });
          const content = await rawResponse.json();
          this.setState({'items' : content})
          //console.log(content);
          //console.log(content.response.status);

        })();
      }
      localrecipeComponent.push(
        <MuiThemeProvider>
          <div>

             <RaisedButton label="next" primary={true} style={style} onClick={(event) => this.goToNext(event)}/>
             <RaisedButton label="previous" primary={true} style={style} onClick={(event) => this.goToPrevious(event)}/>
         </div>
         </MuiThemeProvider>
      )
      this.setState({menuValue:1,recipeComponent:localrecipeComponent})
    

  }

  goToPrevious(event){
    
    this.state.counter = this.state.counter -1;
      //To be done:check for empty values before hitting submit
      if(1){
        (async () => {
          const rawResponse = await fetch(apiBaseUrl, {
            //mode: 'cors',
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
  
          });
          const content = await rawResponse.json();
          this.setState({'items' : content})
          //console.log(content);
          //console.log(content.response.status);

        })();
      }

  }

  goToNext(event){

    this.state.counter = this.state.counter +1;
      //To be done:check for empty values before hitting submit
      if(1){
        (async () => {
          const rawResponse = await fetch(apiBaseUrl, {
            //mode: 'cors',
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
  
          });
          const content = await rawResponse.json();
          this.setState({'items' : content})
          //console.log(content);
          //console.log(content.response.status);

        })();
      }

  }
    

  render() {
    return (
      <div>
        <MuiThemeProvider>
        <AppBar
             title="Recipes"
             
           />
        </MuiThemeProvider>
        {this.state.recipeComponent}
        {<h1>apiBaseUrl: {apiBaseUrl}</h1>}

        <ul>
    
          
             <li> { JSON.stringify(this.state.items[this.state.counter])}</li>
        
        </ul>
      </div>
    );
  }
}

const style = {
  margin: 15,
};

export default Recipe;
