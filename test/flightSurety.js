
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

contract('Flight Surety Tests', async (accounts) => {
    const owner = accounts[0];
    //let instanceData = await FlightSuretyData.deployed();

  // var config;
  // before('setup contract', async () => {
  //   config = await Test.Config(accounts);
  //   await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  // });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

    it("has correct initial isOperational() value", async() => {
        // let transferAmt = await web3.utils.toWei("20", "ether");
        // await web3.eth.sendTransaction({from:accounts[2], to:owner, value:transferAmt});
        let instanceData = await FlightSuretyData.deployed();
        // Get operating status
        // let status = await config.flightSuretyData.isOperational.call();
        let status = await instanceData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it("can call the isOperational function of the data contract from the App contract", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let status = await instanceApp.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it("deploys with the contract owner registered as the first airline", async() => {
        //await FlightSuretyData.deployed();
        let instanceApp = await FlightSuretyApp.deployed();
        let isAirline = await instanceApp.isAirline.call(owner);
        let numAirlines = await instanceApp.howManyAirlines.call();
        assert.equal(isAirline, true, "The contract creator is not a registered airline");
        assert.equal(numAirlines, 1, "There should be only 1 airline after the contract deployment");
    });

    it("deploys with initial contract balance equal to 0", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let contractBalance = await instanceApp.getContractBalance.call();
        assert.equal(contractBalance, 0, "Contract balance after deployment should be equal to 0");
    });

    it("checks if the first airline can send funds to the contract and change its 'isFunded' state", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let airlineFee = await web3.utils.toWei("10", "ether");
        let airlineBalanceBefore = await web3.eth.getBalance(owner);
        await instanceApp.fundAirline({from: owner, value: airlineFee});
        let contractBalance = await instanceApp.getContractBalance.call();
        let airlineBalanceAfter = await web3.eth.getBalance(owner);
        assert.isAbove(Number(airlineBalanceBefore) - Number(airlineBalanceAfter), Number(airlineFee));
        let airline = await instanceApp.getAirline.call(owner);
        let isFunded = airline[3];
        assert.equal(isFunded, true);
    });

    it("checks that a non-airline user cannot register another airline", async() => {
        let user2 = accounts[1];
        let instanceApp = await FlightSuretyApp.deployed();
        let numAirlines = await instanceApp.howManyAirlines.call();
        assert.equal(numAirlines, 1, "There should be only 1 registered airline so far");
        let error;
        try {
            await instanceApp.registerAirline(user2, "Delta airlines", {from:user2});
        } catch(err) {
            error = true;
        }
        assert.equal(error, true, "Non-airline user should not be able to register an airline");
    });

    it("allows registration of up to 4 airlines without 'multiparty consensus'", async() => {
        let airline2 = accounts[1];
        let airline3 = accounts[2];
        let airline4 = accounts[3];
        let instanceApp = await FlightSuretyApp.deployed();
        // first airline registers two consecutive airlines
        await instanceApp.registerAirline(airline2, "Beta Airlines", {from:owner});
        await instanceApp.registerAirline(airline3, "Gamma Airlines", {from:owner});
        let numAirlines = await instanceApp.howManyAirlines.call();
        assert.equal(numAirlines, 3);
        // fourth airline is registered by the unfunded third airline
        await instanceApp.registerAirline(airline4, "Delta Airlines", {from:airline3});
        numAirlines = await instanceApp.howManyAirlines.call();
        assert.equal(numAirlines, 4);
        // check the saved details of the third airline
        let airline3details = await instanceApp.getAirline(airline3);
        assert.equal(airline3details[0], airline3);
        assert.equal(airline3details[1], "Gamma Airlines");
        assert.equal(airline3details[2], true);
        assert.equal(airline3details[3], false);
    });

    it("checks that the fifth airline can be added to the list but its status is Not-registered", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let airline5 = accounts[4];
        await instanceApp.registerAirline(airline5, "Skrzydelko", {from:owner});
        let numAirlines = await instanceApp.howManyAirlines.call();
        assert.equal(numAirlines, 5);
        let airline5details = await instanceApp.getAirline(airline5);
        assert.equal(airline5details[1], "Skrzydelko");
        assert.equal(airline5details[2], false);
    });

    it("checks that the multiparty consensus voting works correctly", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let numAirlines = await instanceApp.howManyAirlines.call();
        // there are 5 airlines in the list
        assert.equal(Number(numAirlines), 5);
        let airline2 = accounts[1];
        let airline3 = accounts[2];
        let airline4 = accounts[3];
        let airline5 = accounts[4];
        let airline5details = await instanceApp.getAirline.call(airline5);
        // the 5th airline is not registered yet
        assert.equal(airline5details[2], false);

        let airline2details = await instanceApp.getAirline.call(airline2);
        assert.equal(airline2details[2], true);

        await instanceApp.castVote(airline5, {from:owner});
        airline5details = await instanceApp.getAirline.call(airline5);
        assert.equal(airline5details[2], false);
        let numVotes = await instanceApp.howManyVotes.call(airline5);
        await instanceApp.castVote(airline5, {from:airline3});
        assert.equal(airline5details[2], false);
        await instanceApp.castVote(airline5, {from:airline4});
        airline5details = await instanceApp.getAirline(airline5);
        // after 3 out of 4 votes the 5th airline gets registered
        assert.equal(airline5details[2], true);

    });

    it("enables a funded airline to register a flight", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let airline1 = owner;
        let airline1Details = await instanceApp.getAirline.call(airline1);
        // the first airline should be funded
        assert.equal(airline1Details[3], true);
        let dateString = "2019-04-28T14:45:00Z"
        let departureDate = new Date(dateString).getTime();
        //departureDate = departureDate 1000;
        //console.log(departureDate);
        await instanceApp.registerFlight("FR109", "WAW", "LON", departureDate, {from:airline1});
        let numFlights = await instanceApp.howManyFlights.call();
        //console.log(Number(numFlights));
        assert.equal(numFlights, 1);
        let flightHash = await instanceApp.getFlightKey.call(airline1, "FR109", departureDate);
        let flightInfo = await instanceApp.getFlight(flightHash);
        // the flight code is correct
        assert.equal(flightInfo[0], "FR109");
        // the flight is registered but not insured yet
        assert.equal(flightInfo[3], true);
        assert.equal(flightInfo[4], false);
        assert.equal(flightInfo[6], departureDate);
        assert.equal(flightInfo[7], airline1);
    });

    it("checks that the funded airline who registered a flight can insure it", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let airline1 = owner;
        let airline1Details = await instanceApp.getAirline.call(airline1);
        // the first airline should be funded
        assert.equal(airline1Details[3], true);
        // get the registered flight

        let dateString = "2019-04-28T14:45:00Z"
        let departureDate = new Date(dateString).getTime();
        let flightHash = await instanceApp.getFlightKey.call(airline1, "FR109", departureDate);
        //console.log(flightHash);
        let flightInfo = await instanceApp.getFlight(flightHash);
        // console.log(flightInfo[1], " Registered?");
        // console.log(flightInfo[2], " Insured?");
        // console.log(Number(flightInfo[4]));
        // console.log(new Date(Number(flightInfo[4])));
        // console.log(flightInfo[5], " Airline?");
        assert.equal(flightInfo[3], true);
        assert.equal(flightInfo[4], false);
        assert.equal(flightInfo[6], departureDate);
        assert.equal(flightInfo[7], airline1);
        await instanceApp.insureFlight(flightHash, {from:airline1});
        flightInfo = await instanceApp.getFlight(flightHash);
        assert.equal(flightInfo[4], true);

    });

    it("checks that a passenger (non-airline user) is able to buy insurance for a flight", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let passenger1 = accounts[5];
        let airline1 = owner;
        let dateString = "2019-04-28T14:45:00Z"
        let departureDate = new Date(dateString).getTime();
        let flightHash = await instanceApp.getFlightKey.call(airline1, "FR109", departureDate);
        let flightInfo = await instanceApp.getFlight(flightHash);
        let insuranceFee = await web3.utils.toWei("1", "ether");
        await instanceApp.buyInsurance(airline1, departureDate, "FR109", {from: passenger1, value: insuranceFee});
        let isInsured = await instanceApp.isInsured(airline1, passenger1, "FR109", departureDate);
        assert.equal(isInsured, true);
        let insuredBalance = await instanceApp.getInsuranceBalance.call(passenger1, flightHash);
        assert.equal(insuranceFee, insuredBalance);
    });

    it("checks that if the oracles' decision is 'LATE_AIRLINE' users' balance is mult by 1.5", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let passenger1 = accounts[5];
        let airline1 = owner;
        let dateString = "2019-04-28T14:45:00Z"
        let departureDate = new Date(dateString).getTime();
        let flightHash = await instanceApp.getFlightKey.call(airline1, "FR109", departureDate);
        // the user is insured
        let isInsured = await instanceApp.isInsured(airline1, passenger1, "FR109", departureDate);
        assert.equal(isInsured, true);
        // check the previous balance
        let prevBalance = await instanceApp.getInsuranceBalance.call(passenger1, flightHash);
        // send and process the oracles' decision
        await instanceApp.processFlightStatus(airline1, "FR109", departureDate, 20);
        let flightInfo = await instanceApp.getFlight(flightHash);
        assert.equal(flightInfo[5], 20);
        let afterBalance = await instanceApp.getInsuranceBalance.call(passenger1, flightHash);
        assert.equal(afterBalance, prevBalance * 1.5);
    });

    it("checks that a user can withdraw their balance", async() => {
        let instanceApp = await FlightSuretyApp.deployed();
        let passenger1 = accounts[5];
        let airline1 = owner;
        let dateString = "2019-04-28T14:45:00Z"
        let departureDate = new Date(dateString).getTime();
        let flightHash = await instanceApp.getFlightKey.call(airline1, "FR109", departureDate);
        let passengerBalanceBefore = await web3.eth.getBalance(passenger1);
        let amountToWithdraw = await instanceApp.getInsuranceBalance.call(passenger1, flightHash);
        await instanceApp.payOut(flightHash, amountToWithdraw, {from:passenger1});
        let passengerBalanceAfter = await web3.eth.getBalance(passenger1);
        console.log(passengerBalanceBefore, " Before");
        console.log(passengerBalanceAfter, " After");
        assert.isAbove(Number(passengerBalanceAfter - passengerBalanceBefore), Number(web3.utils.toWei("1", "ether")));
    });


  // it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
  //
  //     // Ensure that access is denied for non-Contract Owner account
  //     let accessDenied = false;
  //     try
  //     {
  //         await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
  //     }
  //     catch(e) {
  //         accessDenied = true;
  //     }
  //     assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  //
  // });
  //
  // it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
  //
  //     // Ensure that access is allowed for Contract Owner account
  //     let accessDenied = false;
  //     try
  //     {
  //         await config.flightSuretyData.setOperatingStatus(false);
  //     }
  //     catch(e) {
  //         accessDenied = true;
  //     }
  //     assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
  //
  // });
  //
  // it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
  //
  //     await config.flightSuretyData.setOperatingStatus(false);
  //
  //     let reverted = false;
  //     try
  //     {
  //         await config.flightSurety.setTestingMode(true);
  //     }
  //     catch(e) {
  //         reverted = true;
  //     }
  //     assert.equal(reverted, true, "Access not blocked for requireIsOperational");
  //
  //     // Set it back for other tests to work
  //     await config.flightSuretyData.setOperatingStatus(true);
  //
  // });
  //
  // it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
  //
  //   // ARRANGE
  //   let newAirline = accounts[2];
  //
  //   // ACT
  //   try {
  //       await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
  //   }
  //   catch(e) {
  //
  //   }
  //   let result = await config.flightSuretyData.isAirline.call(newAirline);
  //
  //   // ASSERT
  //   assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
  //
  // });


});
