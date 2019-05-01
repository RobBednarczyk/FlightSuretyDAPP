pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    uint numAirlines;
    uint numFlights;

    struct Airline {
        address airlineAddress;
        string name;
        bool isRegistered;
        bool isFunded;
        address[] multicalls;
    }

    Airline[] private airlinesList;
    mapping(address => Airline) internal airlines;

    struct Flight {
        string code;
        string from;
        string to;
        bool isRegistered;
        bool isInsured;
        uint8 statusCode;
        uint256 departureDate;
        address airline;
        address[] insuredPassengers;
    }

    Flight[] private flightsList;
    mapping(bytes32 => Flight) internal flights;

    /*struct Passenger {
        address passengerAddress;
        string[] insuredFlights;
    }*/

    // create a list of passengers that bought insurance
    // address[] internal insuredUsers;

    mapping(address => bytes32[]) private insuredFlights;
    mapping(address => mapping(bytes32 => uint256)) private insuredBalance;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public
    {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(tx.origin == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier notAirline() {
        require(!isAirline(tx.origin), "Airlines are not permitted to use this function");
        _;
    }

    modifier requireAirline() {
        if (numAirlines >= 1) {
            require(isAirline(tx.origin), "Only airlines are permitted to use this function");
        }
        _;
    }

    /*modifier notInsured(string memory flightCode) {
        require(msg.sender)
    }*/

    /*modifier moreThanHalfConsensus(address _airlineAddress, bool registered) {
        if (numAirlines <= 4) {
            _;
        } else {
            if (airlines[_airlineAddress].multicalls.length <= (numAirlines / 2)) {
                //airlines[_airlineAddress].isRegistered = true;
                castVote(_airlineAddress);
                registered = false;
                _;
            } else {
                registered = true;
                _;
            }
        }
    }*/



    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode) external requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address _airlineAddress, string _airlineName) external requireAirline requireIsOperational {
        require(!airlines[_airlineAddress].isRegistered, "Airline must not be already registered");
        if (numAirlines < 4) {
            Airline memory newAirline = Airline({
                airlineAddress: _airlineAddress,
                name: _airlineName,
                isRegistered: true,
                isFunded: false,
                multicalls: new address[](0)
            });
            numAirlines = airlinesList.push(newAirline);
            airlines[_airlineAddress] = newAirline;
        } else {
            Airline memory newAirline2 = Airline({
                airlineAddress: _airlineAddress,
                name: _airlineName,
                isRegistered: false,
                isFunded: false,
                multicalls: new address[](0)
            });
            numAirlines = airlinesList.push(newAirline2);
            airlines[_airlineAddress] = newAirline2;
        }
    }

    function registerFlight(string _flightCode, string _origin, string _destination, uint256 _departureDate) external requireAirline requireIsOperational {
        require(airlines[tx.origin].isFunded);
        bytes32 flightHash = getFlightKey(tx.origin, _flightCode, _departureDate);
        // the flight cannot be registered before
        require(!flights[flightHash].isRegistered, "The flight is already registered");
        Flight memory newFlight = Flight({
            code: _flightCode,
            from: _origin,
            to: _destination,
            isRegistered: true,
            isInsured: false,
            statusCode: 0,
            departureDate: _departureDate,
            airline: tx.origin,
            insuredPassengers: new address[](0)
        });

        numFlights = flightsList.push(newFlight);
        flights[flightHash] = newFlight;
    }

    /*function insureFlight(bytes32 _flightHash) external requireAirline {
        //bytes32 flightHash = getFlightKey(tx.origin, _flightCode, _departureDate);
        require(flights[_flightHash].airline == tx.origin);
        Flight storage flightToUpdate = flights[_flightHash];
        flightToUpdate.isInsured = true;
    }*/

    function insureFlight(string _flightCode, uint256 _departureDate) external requireAirline requireIsOperational {
        bytes32 flightHash = getFlightKey(tx.origin, _flightCode, _departureDate);
        require(flights[flightHash].airline == tx.origin);
        Flight storage flightToUpdate = flights[flightHash];
        flightToUpdate.isInsured = true;
    }

    function isAirline(address userAddress) public view returns(bool) {
        return airlines[userAddress].isRegistered;
    }

    function howManyAirlines() external view returns(uint) {
        return airlinesList.length;
    }

    function howManyFlights() external view returns(uint) {
        return flightsList.length;
    }

    function howManyInsured(bytes32 _flightHash) external view returns(uint) {
        return flights[_flightHash].insuredPassengers.length;
        //return insuredPassengers.length;
    }

    function getInsured(bytes32 _flightHash, uint index) external view returns(address) {
        return flights[_flightHash].insuredPassengers[index];
    }

    // get the current insurance fund balance
    function getContractBalance() external requireIsOperational view returns(uint) {
        return address(this).balance;
    }

    function castVote(address _airlineAddress) public requireAirline requireIsOperational {
        // check if the airline has already voted
        require(!alreadyVoted(tx.origin, _airlineAddress));
        // check if the airline that is being voted on is not registered yet
        require(!airlines[_airlineAddress].isRegistered);
        Airline storage airlineToUpdate = airlines[_airlineAddress];
        airlineToUpdate.multicalls.push(tx.origin);
        if (airlineToUpdate.multicalls.length > (numAirlines.div(2))) {
            airlineToUpdate.isRegistered = true;
        }
    }

    function alreadyVoted(address _voter, address _airlineAddress) public view returns(bool) {
        bool voted = false;
        for (uint counter=0; counter<airlines[_airlineAddress].multicalls.length; counter++) {
            if (airlines[_airlineAddress].multicalls[counter] == _voter) {
                voted = true;
                break;
            }
        }
        return voted;
    }
    function howManyVotes(address _airlineAddress) external view returns(uint) {
        return airlines[_airlineAddress].multicalls.length;
    }

    function isInsured(address _airlineAddress, address _passengerAddress, string _flightCode, uint departureDate) public view returns(bool) {
        bool insured = false;
        bytes32 flightHash = getFlightKey(_airlineAddress, _flightCode, departureDate);
        for (uint counter = 0; counter < insuredFlights[_passengerAddress].length; counter++) {
            if (insuredFlights[_passengerAddress][counter] == flightHash) {
                insured = true;
                break;
            }
        }
        return insured;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buyInsurance(address _airlineAddress, uint departureDate, string flightCode)
                    external
                    payable
                    notAirline
    {
        require(!isInsured(_airlineAddress, tx.origin, flightCode, departureDate), "User already bought insurance for this flight");
        require(msg.value <= 1 ether && msg.value > 0 ether);
        bytes32 flightHash = getFlightKey(_airlineAddress, flightCode, departureDate);
        insuredFlights[tx.origin].push(flightHash);
        // store the paid premium
        insuredBalance[tx.origin][flightHash] = msg.value;
        // register the insured passenger
        //insuredUsers.push(tx.origin);
        Flight storage flightToUpdate = flights[flightHash];
        flightToUpdate.insuredPassengers.push(tx.origin);

    }

    function getInsuranceBalance(address _passengerAddress, bytes32 _flightHash) external view returns(uint) {
        return insuredBalance[_passengerAddress][_flightHash];
    }

    function setInsuranceBalance(address _passengerAddress, bytes32 _flightHash, uint newVal) external {
        insuredBalance[_passengerAddress][_flightHash] = newVal;
    }

    function updateFlightStatus(bytes32 _flightHash, uint8 newStatus) external requireIsOperational {
        Flight storage flightToUpdate = flights[_flightHash];
        flightToUpdate.statusCode = newStatus;
    }

    function updateInsuredBalance(bytes32 _flightHash) external requireIsOperational {
        Flight storage flightToUpdate = flights[_flightHash];
        for (uint c = 0; c < flightToUpdate.insuredPassengers.length; c++) {
            address insured = flightToUpdate.insuredPassengers[c];
            // update the insured balance
            insuredBalance[insured][_flightHash] = insuredBalance[insured][_flightHash].mul(15);
            insuredBalance[insured][_flightHash] = insuredBalance[insured][_flightHash].div(10);
        }
    }

    /**
     *  @dev Credits payouts to insurees
    */
    /*function creditInsurees(address _passengerAddress, bytes32 _flightHash) internal {

    }*/


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function payOut(bytes32 _flightHash, uint amount) external requireIsOperational {
        require(insuredBalance[tx.origin][_flightHash] >= amount, "Insufficient funds");
        insuredBalance[tx.origin][_flightHash] = insuredBalance[tx.origin][_flightHash].sub(amount);
        tx.origin.transfer(amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function getAirline(address _airlineAddress) external view returns(address, string memory, bool, bool, address[]) {
        Airline memory airline = airlines[_airlineAddress];
        return (airline.airlineAddress, airline.name, airline.isRegistered, airline.isFunded, airline.multicalls);
    }

    function getAirlineByNum(uint airlineNum) external view returns(address, string memory, bool, bool, address[]) {
        Airline memory airline = airlinesList[airlineNum];
        return (airline.airlineAddress, airline.name, airline.isRegistered, airline.isFunded, airline.multicalls);
    }

    function fundAirline(address _airlineAddress) external payable requireAirline {
        require(msg.value == 10 ether, "The initial airline fee is equal to 10 ether");
        airlines[_airlineAddress].isFunded = true;
        //airlines[msg.sender].name = "testName";
    }

    function getFlight(bytes32 _flightHash) external view returns(string memory, string memory, string memory, bool, bool, uint8, uint256, address) {
        Flight memory flight = flights[_flightHash];
        return (flight.code, flight.from, flight.to, flight.isRegistered, flight.isInsured, flight.statusCode, flight.departureDate, flight.airline);
    }

    function getFlightByNum(uint flightNum) external view returns(string memory, string memory, string memory, bool, bool, uint8, uint256, address, address[]) {
        Flight memory flight = flightsList[flightNum];
        return (flight.code, flight.from, flight.to, flight.isRegistered, flight.isInsured, flight.statusCode, flight.departureDate, flight.airline, flight.insuredPassengers);
    }

    // added getInsured flights by passenger address
    function getInsuredFlights(address _passengerAddress, uint _index) external view returns(bytes32) {
        return insuredFlights[_passengerAddress][_index];
    }

    function getInsuredKeysLength(address _passengerAddress) external view returns(uint256) {
        return insuredFlights[_passengerAddress].length;
    }

    function getFlightKey(address airline, string memory flightCode, uint256 timestamp)
                        pure
                        public
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flightCode, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    /*function()
                            external
                            payable
    {
        fundAirline();
    }*/


}
