package main

//importing libs
import (
	"fmt"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
)

var (
	apiKey = "xxxxxxxf89aefd20896f07325xxxxxx"
        api_hits = 0
)


func getCurrentWeather(w http.ResponseWriter, r *http.Request) {
        api_hits = api_hits + 1

        if api_hits >= 1 {
            fmt.Println("Your API hits =", api_hits)
	}
        vars := mux.Vars(r)
	city := vars["id"]

	//api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=xxxxxxxf89aefd20896f073253xxxxxx
        apiKey = os.Getenv("API_KEY")
	urlString := fmt.Sprintf("http://api.openweathermap.org/data/2.5/weather?q=%s&APPID=%s", city, apiKey)
	u, err := url.Parse(urlString)
	res, err := http.Get(u.String())

	if err != nil {
		log.Fatal(err)
	}

	jsonBlob, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		log.Fatal(err)
	}

	resString := string(jsonBlob)
	fmt.Fprintf(w, resString)
}

func handleRequests() {
        fmt.Println("Web service is up")
        fmt.Println("Webservice listening on 0.0.0.0:8080")

	myRouter := mux.NewRouter().StrictSlash(true)
	myRouter.HandleFunc("/current/{id}", getCurrentWeather).Methods("GET")
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", myRouter))


}

func main() {

	handleRequests()
}
