pragma solidity >=0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // data contract - state variable
    FlightSuretyData flightSuretyData;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract




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
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address dataContractAddr) public
    {
        contractOwner = tx.origin;
        flightSuretyData = FlightSuretyData(dataContractAddr);
        registerAirline(contractOwner, "Alpha Airlines");

    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns(bool)
    {
        return flightSuretyData.isOperational();  // Modify to call data contract's status
    }

    function setOperatingStatus(bool mode) public
    {
        flightSuretyData.setOperatingStatus(mode);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline(address airlineAddress, string airlineName) public

    {
        flightSuretyData.registerAirline(airlineAddress, airlineName);
        //return (success, 0);
    }

    function isAirline(address userAddress) public view returns(bool) {
        return flightSuretyData.isAirline(userAddress);
    }

    function howManyAirlines() external view returns(uint) {
        return flightSuretyData.howManyAirlines();
    }

    function howManyFlights() external view returns(uint) {
        return flightSuretyData.howManyFlights();
    }

    function howManyInsured(bytes32 _flightHash) external view returns(uint) {
        return flightSuretyData.howManyInsured(_flightHash);
    }

    // get the current insurance fund balance
    function getContractBalance() public view returns(uint) {
        return flightSuretyData.getContractBalance();
    }

    // send the airline fee
    function fundAirline() public payable {
        flightSuretyData.fundAirline.value(msg.value)(msg.sender);
        //flightSuretyData.fundAirline.value(msg.value);
    }

    function getAirline(address _airlineAddress) public view returns(address, string memory, bool, bool, address[]) {
        return flightSuretyData.getAirline(_airlineAddress);
    }

    function castVote(address _airlineAddress) public {
        flightSuretyData.castVote(_airlineAddress);
    }

    function howManyVotes(address _airlineAddress) public view returns(uint) {
        return flightSuretyData.howManyVotes(_airlineAddress);
    }

    function alreadyVoted(address voter, address airlineAddress) public view returns(bool) {
        return flightSuretyData.alreadyVoted(voter, airlineAddress);
    }



   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight(string memory _flightCode, uint256 _departureDate) public {
        flightSuretyData.registerFlight(_flightCode, _departureDate);
    }

    function isInsured(address _airlineAddress, address _passengerAddress, string _flightCode, uint departureDate) public view returns(bool) {
        return flightSuretyData.isInsured(_airlineAddress, _passengerAddress, _flightCode, departureDate);
    }

    function getFlight(bytes32 _flightHash) public view returns(string memory, bool, bool, uint8, uint256, address) {
        return flightSuretyData.getFlight(_flightHash);
    }

    function insureFlight(bytes32 _flightHash) public {
        flightSuretyData.insureFlight(_flightHash);
    }

    function buyInsurance(address _airlineAddress, uint departureDate, string memory flightCode) public payable {
        flightSuretyData.buyInsurance.value(msg.value)(_airlineAddress, departureDate, flightCode);
    }

    function getInsuranceBalance(address _passengerAddress, bytes32 _flightHash) public view returns(uint) {
        return flightSuretyData.getInsuranceBalance(_passengerAddress, _flightHash);
    }

    function setInsuranceBalance(address _passengerAddress, bytes32 _flightHash, uint newVal) private {
        flightSuretyData.setInsuranceBalance(_passengerAddress, _flightHash, newVal);
    }

    function getInsured(bytes32 _flightHash, uint index) external returns(address) {
        return flightSuretyData.getInsured(_flightHash, index);
    }

    function updateInsuredBalance(bytes32 _flightHash) internal {
        flightSuretyData.updateInsuredBalance(_flightHash);
    }

    function updateFlightStatus(bytes32 _flightHash, uint8 newStatus) internal {
        flightSuretyData.updateFlightStatus(_flightHash, newStatus);
    }

    function payOut(bytes32 _flightHash, uint amount) public {
        flightSuretyData.payOut(_flightHash, amount);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus(
        address airline,
        string memory flightCode,
        uint256 departureDate,
        uint8 statusCode) public

    {
        bytes32 flightHash = getFlightKey(airline, flightCode, departureDate);
        // update the flight status code
        updateFlightStatus(flightHash, statusCode);
        updateInsuredBalance(flightHash);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }




// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) internal oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() external payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes() view external returns(uint8[3]) {

        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }

    function getOracleInfo(address _oracleAddress) public view requireContractOwner returns(bool, uint8[3]) {
        return (oracles[_oracleAddress].isRegistered, oracles[_oracleAddress].indexes);
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            // do not accept additional responses
            // oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        public
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    /*// safeWithDraw function
    mapping(address => uint256) private balance;
    function safeWithDraw(uint256 amount) external {
        // checks
        require(msg.sender == tx.origin, "Contracts not allowed");
        require(balance[msg.sender] >= amount, "Insufficient funds");
        uint256 amount = balance[msg.sender];
        balance[msg.sender] = balance[msg.sender].sub(amount);
        msg.sender.transfer(amount);
    }*/

// endregion

}

// add the data contract interface
contract FlightSuretyData {
    function isOperational() public view returns(bool);
    function setOperatingStatus(bool mode) external;
    function registerAirline(address _airlineAddress, string _airlineName) external;
    function isAirline(address userAddress) public view returns(bool);
    function howManyAirlines() external view returns(uint);
    function howManyFlights() external view returns(uint);
    function getContractBalance() external view returns(uint);
    function getAirline(address _airlineAddress) external view returns(address, string memory, bool, bool, address[]);
    function fundAirline(address airlineAddress) external payable;
    function castVote(address _airlineAddress) public;
    function howManyVotes(address _airlineAddress) external view returns(uint);
    function alreadyVoted(address _voter, address _airlineAddress) public view returns(bool);
    function getFlightKey(address airline, string memory flightCode, uint256 timestamp) pure public returns(bytes32);
    function registerFlight(string _flightCode, uint256 _departureDate) external;
    function insureFlight(bytes32 _flightHash) external;
    function isInsured(address _airlineAddress, address _passengerAddress, string _flightCode, uint departureDate) public view returns(bool);
    function getFlight(bytes32 _flightHash) external view returns(string memory, bool, bool, uint8, uint256, address);
    function buyInsurance(address _airlineAddress, uint departureDate, string flightCode) external payable;
    function getInsuranceBalance(address _passengerAddress, bytes32 _flightHash) external view returns(uint);
    function setInsuranceBalance(address _passengerAddress, bytes32 _flightHash, uint newVal) external;
    function updateFlightStatus(bytes32 _flightHash, uint8 newStatus) external;
    function howManyInsured(bytes32 _flightHash) external view returns(uint);
    function getInsured(bytes32 _flightHash, uint index) external returns(address);
    function updateInsuredBalance(bytes32 _flightHash) external;
    function payOut(bytes32 _flightHash, uint amount) external;
}
