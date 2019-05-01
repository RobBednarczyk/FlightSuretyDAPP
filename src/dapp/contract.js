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
        this.allAccounts = [];
    }

    async initialize(callback) {

        // let account = await web3.eth.getCoinbase();
        // this.currentAccount = account;
        // console.log(account);
        try {
            let accts = await this.web3.eth.getAccounts();
            this.allAccounts = accts;
            this.owner = accts[0];
            let counter = 1;
            let numAirlines = await this.howManyAirlines();
            console.log(numAirlines);
            if (numAirlines == 1) {
                this.airlines.push(this.owner);
                while(this.airlines.length < 4) {
                    this.airlines.push(accts[counter++]);
                }
            } else {
                for (let c = 0; c < numAirlines; c++) {
                    let airlineInfo = await this.getAirlineByNum(c);
                    this.airlines.push(airlineInfo[0]);
                    counter++
                }
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            while(accts.length - counter > 0) {
                this.users.push(accts[counter++]);
            }
            console.log(this.airlines);
            callback();
        } catch(error) {
            console.log(error);
        }
    }

    async getAirline(airlineAddress) {
        let self = this;
        let airline = await self.flightSuretyApp.methods.getAirline(airlineAddress).call();
        return airline;
    }

    async getAirlineByNum(airlineNum) {
        let self = this;
        let airline = await self.flightSuretyApp.methods.getAirlineByNum(airlineNum).call();
        return airline;
    }

    async howManyAirlines() {
        let self = this;
        let numAirlines = await self.flightSuretyApp.methods.howManyAirlines().call();
        return numAirlines;
    }

    async castVote(airlineAddress, sender) {
        let self = this;
        await self.flightSuretyApp.methods.castVote(airlineAddress).send({from:sender});
    }

    async registerAirline(senderAddress, airlineAddress, airlineName) {
        let self = this;
        return await self.flightSuretyApp.methods
            .registerAirline(airlineAddress, airlineName)
            .send({from: senderAddress, gas:500000});
    }

    async fundAirline(airlineAddress) {
        let self = this;
        let airlineFee = await self.web3.utils.toWei("10", "ether");
        return await self.flightSuretyApp.methods
            .fundAirline()
            .send({from:airlineAddress, value:airlineFee});
    }

    async registerFlight(airline, flightCode, flightOrigin, flightDestination, departureDate) {
        let self = this;
        return await self.flightSuretyApp.methods
            .registerFlight(flightCode, flightOrigin, flightDestination, departureDate)
            .send({from:airline, gas: 500000});
    }

    async howManyFlights() {
        let self = this;
        return await self.flightSuretyApp.methods
            .howManyFlights()
            .call();
    }

    async getFlight(flightKey) {
        let self = this;
        return await self.flightSuretyApp.methods
            .getFlight(flightKey)
            .call();
    }

    async getFlightByNum(flightNum) {
        let self = this;
        return await self.flightSuretyApp.methods
            .getFlightByNum(flightNum)
            .call();
    }

    async getFlightKey(airlineAddress, flightCode, departureDate) {
        let self = this;
        let flightKey = await self.flightSuretyApp.methods
            .getFlightKey(airlineAddress, flightCode, departureDate)
            .call();
        return flightKey;
    }
        // return await self.flightSuretyApp.methods
        //     .getFlightKey(airlineAddress, flightCode, departureDate)
        //     .call();
    //}

    async insureFlight(airlineSender, flightCode, departureDate) {
        let self = this;
        return await self.flightSuretyApp.methods
            .insureFlight(flightCode, departureDate)
            .send({from:airlineSender});
    }

    async buyInsurance(passengerAddress, airlineAddress, departureDate, flightCode, premium) {
        let self = this;
        return await self.flightSuretyApp.methods
            .buyInsurance(airlineAddress, departureDate, flightCode)
            .send({from:passengerAddress, value:premium, gas:500000});
    }

    async getInsuredFlights(passengerAddress, index) {
        let self = this;
        return await self.flightSuretyApp.methods
            .getInsuredFlights(passengerAddress, index)
            .call();
    }

    async getInsuredKeysLength(passengerAddress) {
        let self = this;
        return await self.flightSuretyApp.methods
            .getInsuredKeysLength(passengerAddress)
            .call();
    }

    async getContractBalance() {
        let self = this;
        return await self.flightSuretyApp.methods
            .getContractBalance()
            .call();
    }

    async setOpStatus(userAddress, mode) {
        let self = this;
        return await self.flightSuretyApp.methods
            .setOperatingStatus(mode)
            .send({from:userAddress});
    }

    async getFlightStatus(airlineAddress, flightCode, departureDate) {
        let self = this;
        return await self.flightSuretyApp.methods
            .fetchFlightStatus(airlineAddress, flightCode, departureDate)
            .call();
    }

    async getInsuranceBalance(passengerAddress, flightKey) {
        let self = this;
        return await self.flightSuretyApp.methods
            .getInsuranceBalance(passengerAddress, flightKey)
            .call();
    }

    async payOut(passengerAddress, flightKey, amount) {
        let self = this;
        return await self.flightSuretyApp.methods
            .payOut(flightKey, amount)
            .send({from:passengerAddress});
    }
    // registerAirline(senderAddress, airlineAddress, airlineName, callback) {
    //     let self = this;
    //     self.flightSuretyApp.methods
    //         .registerAirline(airlineAddress, airlineName)
    //         .send({from:senderAddress, gas:2000000}, (error, result) => {
    //             callback(error, result);
    //         });
    // }

    async getOpStatus() {
        let self = this;
        return await self.flightSuretyApp.methods
            .isOperational()
            .call();
    }

    // isOperational(callback) {
    //    let self = this;
    //    self.flightSuretyApp.methods
    //         .isOperational()
    //         .call({ from: self.owner}, callback);
    // }

    // fetchFlightStatus(flight, callback) {
    //     let self = this;
    //     let payload = {
    //         airline: self.airlines[0],
    //         flight: flight,
    //         timestamp: Math.floor(Date.now() / 1000)
    //     }
    //     self.flightSuretyApp.methods
    //         .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
    //         .send({ from: self.owner}, (error, result) => {
    //             callback(error, payload);
    //         });
    // }

    // async showAirlines() {
    //     let self = this;
    //
    // }



    // getAvailableAirlines(callback) {
    //     let self = this;
    //     return self.airlines;
    // }
}
