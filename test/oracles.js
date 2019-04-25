
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');
//import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
contract('Oracles', async (accounts) => {

  before('setup contract', async () => {
    //config = await Test.Config(accounts);
    // Watch contract events
    //let events = instanceApp.allEvents();
    //
    var instanceApp = await FlightSuretyApp.deployed();
    var fee = await instanceApp.REGISTRATION_FEE.call();
    var airlineFee = await web3.utils.toWei("10", "ether");
    var event = instanceApp.OracleRequest();
    console.log(event);
    event.watch(function(error, result) {
        if(!error) {
            console.log(result);
        }
    })
    // instanceApp.events.OracleRequest({
    //     fromBlock: 0
    // }, function (error, event) {
    //   if (error) {
    //       console.log(error);
    //   } else {
    //       console.log(event);
    //   }
    // });

    // events.watch((error, result) => {
    //     if(result.event === "OracleRequest") {
    //         console.log(`\n\nOracle requested: index: ${result.args.index.toNumber()}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp}`);
    //     } else {
    //         console.log(`\n\nFlight status available: flight: ${result.args.flight}, timestamp: ${result.args.timestamp}`);
    //     }
    // });


  });

  const TEST_ORACLES_COUNT = 20;
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  const owner = accounts[0];
  it("can register oracles", async() => {

      let instanceApp = await FlightSuretyApp.deployed();
      let fee = await instanceApp.REGISTRATION_FEE.call();

      for(let a=1; a<=TEST_ORACLES_COUNT; a++) {
          await instanceApp.registerOracle({ from: accounts[a], value: fee });
          let result = await instanceApp.getMyIndexes.call({from: accounts[a]});
          console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
      }
      let isOracle1Reg = await instanceApp.getOracleInfo(accounts[1], {from:owner});
      assert.equal(isOracle1Reg[0], true);
      let isOracle5Reg = await instanceApp.getOracleInfo(accounts[5], {from:owner});
      assert.equal(isOracle5Reg[0], true);

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
      await instanceApp.registerFlight("FR109", departureDate, {from:airline1});
      let numFlights = await instanceApp.howManyFlights.call();
      //console.log(Number(numFlights));
      assert.equal(numFlights, 1);
      let flightHash = await instanceApp.getFlightKey.call(airline1, "FR109", departureDate);
      let flightInfo = await instanceApp.getFlight(flightHash);
      // the flight code is correct
      assert.equal(flightInfo[0], "FR109");
      // the flight is registered but not insured yet
      assert.equal(flightInfo[1], true);
      assert.equal(flightInfo[2], false);
      assert.equal(flightInfo[4], departureDate);
      assert.equal(flightInfo[5], airline1);
  });

  it('can request flight status', async () => {
      let instanceApp = await FlightSuretyApp.deployed();
      let flight = 'FR109'; // flight code
      let dateString = "2019-04-28T14:45:00Z"
      let departureDate = new Date(dateString).getTime();
      //Submit a request for oracles to get status information for a flight
      await instanceApp.fetchFlightStatus(owner, flight, departureDate);

      //let isOracle1Reg = await instanceApp.getOracleInfo(accounts[1]);
      //   console.log(isOracle1Reg[0]);
      //   console.log(Number(isOracle1Reg[1][0]), Number(isOracle1Reg[1][1]), Number(isOracle1Reg[1][2]));
      var numResponses = 0;
      for(let a=1; a<=TEST_ORACLES_COUNT; a++) {
      //
    //   // Get oracle information
      //
      let oracleIndexes = await instanceApp.getMyIndexes.call({ from: accounts[a]});

      try {
    //      // Submit a response...it will only be accepted if there is an Index match
        await instanceApp.submitOracleResponse(oracleIndexes[0], owner, flight, departureDate, STATUS_CODE_ON_TIME, { from: accounts[a] });
        numResponses+=1;
    //       let numFlights = await instanceApp.howManyFlights.call();
    //       console.log(Number(numFlights));
        } catch(e) {
    //       // Enable this when debugging
    //       console.log(e);
          console.log(`\nOracle no. ${a} not chosen`, 0, oracleIndexes[0].toNumber(), flight, departureDate);
        }
    }
    console.log("Num valid responses: ", numResponses)
    if (numResponses >= 3) {
        //console.log("Num valid responses: ", numResponses)
        let flightHash = await instanceApp.getFlightKey(owner, flight, departureDate);
        let flightInfo = await instanceApp.getFlight(flightHash);
        console.log("Flight code: ", flightInfo[0]);
        console.log("Status code: ", Number(flightInfo[3]));
        assert.equal(flightInfo[0], "FR109");
        assert.equal(flightInfo[3], STATUS_CODE_ON_TIME);
    }

  });
  // it('can register oracles', async () => {
  //
  //   // ARRANGE
  //   let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
  //
  //   // ACT
  //   for(let a=1; a<TEST_ORACLES_COUNT; a++) {
  //     await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
  //     let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
  //     console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
  //   }
  // });
  //
  // it('can request flight status', async () => {
  //
  //   // ARRANGE
  //   let flight = 'ND1309'; // Course number
  //   let timestamp = Math.floor(Date.now() / 1000);
  //
  //   // Submit a request for oracles to get status information for a flight
  //   await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
  //   // ACT
  //
  //   // Since the Index assigned to each test account is opaque by design
  //   // loop through all the accounts and for each account, all its Indexes (indices?)
  //   // and submit a response. The contract will reject a submission if it was
  //   // not requested so while sub-optimal, it's a good test of that feature
  //   for(let a=1; a<TEST_ORACLES_COUNT; a++) {
  //
  //     // Get oracle information
  //     let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
  //     for(let idx=0;idx<3;idx++) {
  //
  //       try {
  //         // Submit a response...it will only be accepted if there is an Index match
  //         await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
  //
  //       }
  //       catch(e) {
  //         // Enable this when debugging
  //         console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
  //       }
  //
  //     }
  //   }
  //
  //
  // });



});
