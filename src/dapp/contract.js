import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.users = [];
        this.currentAccount = null;
    }

    initialize(callback) {

        // let account = await web3.eth.getCoinbase();
        // this.currentAccount = account;
        // console.log(account);

        this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];
            //console.log(accts);
            // the owner is an airline from default
            this.airlines.push(this.owner);
            let counter = 1;


            while(this.airlines.length < 4) {
                let account = accts[counter++]
                // registerAirline(this.owner, account, initialAirlineNames[counter-2], (error, result) => {
                //     if (error) {
                //         console.log(error);
                //     } else if (result) {
                //         console.log(result);
                //     }
                // });
                this.airlines.push(account);
            }
            console.log(this.airlines);

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            while(accts.length - counter > 0) {
                this.users.push(accts[counter++]);
            }
            // console.log(accts);

            // console.log(this.passengers);
            // console.log(this.users);
            //console.log(this.airlines);
            callback();
        });
    }

    // getAirline(airlineAddress, callback) {
    //     let self = this;
    //     self.flightSuretyApp.methods
    //         .getAirline(airlineAddress)
    //         .call({from:self.owner}, callback);
    // }
    async getAirline(airlineAddress) {
        let self = this;
        let airline = await self.flightSuretyApp.methods.getAirline(airlineAddress).call();
        return airline;
    };

    async howManyAirlines() {
        let self = this;
        let numAirlines = await self.flightSuretyApp.methods.howManyAirlines().call();
        return numAirlines;
    };

    async castVote(airlineAddress, sender) {
        let self = this;
        await self.flightSuretyApp.methods.castVote(airlineAddress).send({from:sender});
    }

    async registerAirline(senderAddress, airlineAddress, airlineName) {
        let self = this;
        return self.flightSuretyApp.methods
            .registerAirline(airlineAddress, airlineName)
            .send({from: senderAddress, gas:1000000});
    }

    // registerAirline(senderAddress, airlineAddress, airlineName, callback) {
    //     let self = this;
    //     self.flightSuretyApp.methods
    //         .registerAirline(airlineAddress, airlineName)
    //         .send({from:senderAddress, gas:2000000}, (error, result) => {
    //             callback(error, result);
    //         });
    // }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    // async showAirlines() {
    //     let self = this;
    //
    // }



    // getAvailableAirlines(callback) {
    //     let self = this;
    //     return self.airlines;
    // }
}
