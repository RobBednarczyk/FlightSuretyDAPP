
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import {flightCodes} from "./flightData.js";


(async() => {

    let result = null;
    //console.log("test");


    let contract = new Contract('localhost', () => {

        // add onfo about the owner of the contract
        (async() => {
            let owner = contract.owner;
            try {
                let airlineInfo = await contract.getAirline(owner);
                let address = airlineInfo[0];
                let airlineName = airlineInfo[1];
                let isRegistered = airlineInfo[2];
                let isFunded = airlineInfo[3];
                let contractOwnerElement = document.getElementById("contractOwner");
                let ownerInfoList = document.createElement("ul");
                for (let c = 0; c <= 3; c++) {
                    let listElement = document.createElement("li");
                    switch (c) {
                        case 0:
                            listElement.innerHTML = `Address: ${address}`;
                            break;
                        case 1:
                            listElement.innerHTML = `Airline: ${airlineName}`;
                            break;
                        case 2:
                            listElement.innerHTML = `Is registered: ${isRegistered}`;
                            break;
                        case 3:
                            listElement.innerHTML = `Is funded: ${isFunded}`;
                            break;
                        }
                    ownerInfoList.appendChild(listElement);
                }
                contractOwnerElement.appendChild(ownerInfoList);
                let showBalanceBtn = document.createElement("button");
                showBalanceBtn.innerHTML = "Show contract balance";
                showBalanceBtn.setAttribute("class", "btn btn-primary");
                showBalanceBtn.addEventListener("click", async function() {
                    let currentBalance = await contract.getContractBalance();
                    alert(`Current contract balance is: ${currentBalance / 10**18} ether`);
                });
                contractOwnerElement.appendChild(showBalanceBtn);

            } catch(e) {
                console.log(e);
            }
        })();

        // register all the airlines from the initial list - do it only once
        (async() => {
            var owner = contract.owner;
            let initialAirlineNames = ["Beta airlines",
                                        "Gamma airlines",
                                        "Globetrotter airlines"
                                    ];
            let numAirlines = await contract.howManyAirlines();
            console.log(Number(numAirlines));
            //console.log(initialAirlineNames.length);
            if (numAirlines < 4) {
                for(let c = 0; c < initialAirlineNames.length; c++) {
                    try {
                        await contract.registerAirline(owner, contract.airlines[c+1], initialAirlineNames[c]);
                        console.log(`Airline ${initialAirlineNames[c]} is being registered...`);
                    } catch(error) {
                        console.log("There was an error");
                        console.log(error);
                    }
                }
                numAirlines = await contract.howManyAirlines();
                console.log(Number(numAirlines));
            }
        })();

        // add the selector options with all the airlines to the airline registration form
        (async() => {
            let selectAirlineAddress = document.getElementById("selAddress");
            let airlines = contract.airlines;
            for (let c = 0; c < airlines.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", airlines[c]);
                newOption.innerHTML = `${c}: ${airlines[c]}`;
                selectAirlineAddress.appendChild(newOption);
            }
            selectAirlineAddress.addEventListener("change", () => {
                let addressParagraph = document.getElementById("currentAddress");
                addressParagraph.innerHTML = selectAirlineAddress.value;
            })
        })();

        // add the selector options with all the users

        (async() => {
            let allUsers = contract.allAccounts;
            let airlineRegAddressElement = document.getElementById("airlineReg-address");
            //let airlineFundAddressElement = document.getElementById("airlineFund-address");
            for (let c = 0; c < allUsers.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", allUsers[c]);
                newOption.innerHTML = `${c}: ${allUsers[c]}`;
                airlineRegAddressElement.appendChild(newOption);
                //airlineFundAddressElement.appendChild(newOption);
            }
        })();

        (async() => {
            let allUsers = contract.allAccounts;
            //let airlineRegAddressElement = document.getElementById("airlineReg-address");
            let airlineFundAddressElement = document.getElementById("airlineFund-address");
            for (let c = 0; c < allUsers.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", allUsers[c]);
                newOption.innerHTML = `${c}: ${allUsers[c]}`;
                //airlineRegAddressElement.appendChild(newOption);
                airlineFundAddressElement.appendChild(newOption);
            }
        })();

        (async() => {
            let allUsers = contract.allAccounts;
            let passengerAddressElement = document.getElementById("selPassengerAddress");
            //let airlineFundAddressElement = document.getElementById("airlineFund-address");
            for (let c = 0; c < allUsers.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", allUsers[c]);
                newOption.innerHTML = `${c}: ${allUsers[c]}`;
                passengerAddressElement.appendChild(newOption);
            }
            passengerAddressElement.addEventListener("change", async function() {
                let passengerPlaceholderElement = document.getElementById("currentPassengerAddress");
                passengerPlaceholderElement.innerHTML = passengerAddressElement.value;
            });
        })();

        (async() => {
            let flightDataKeys = Object.keys(flightCodes);
            let flightOriginElement = document.getElementById("flightOrigin");
            let flightDestinationElement = document.getElementById("flightDestination");
            for (let c = 0; c < flightDataKeys.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", flightDataKeys[c]);
                newOption.innerHTML = flightDataKeys[c];
                flightOriginElement.appendChild(newOption);
                newOption = document.createElement("option");
                newOption.innerHTML = flightDataKeys[c];
                flightDestinationElement.appendChild(newOption);
            }

            flightOriginElement.addEventListener("change", () => {
                let originCodeElement = document.getElementById("originCode");
                originCodeElement.innerHTML = flightCodes[flightOriginElement.value];
            });

            flightDestinationElement.addEventListener("change", () => {
                let destinationCodeElement = document.getElementById("destinationCode");
                destinationCodeElement.innerHTML = flightCodes[flightDestinationElement.value];
            });

        })();

        (async() => {
            let flightDeptDateElement = document.getElementById("flightDepartureDay");
            flightDeptDateElement.addEventListener("change", () => {
                alert(flightDeptDateElement.value);
            })
        })();

        // fill in the hour and minute selectors - register flight functionality
        (async() => {
            let hourElem = document.getElementById("flightHour");
            let minuteElem = document.getElementById("flightMinute");
            for (let c = 0; c < 24; c++) {
                let newOption = document.createElement("option");
                if (c < 10) {
                    newOption.setAttribute("value", `0${c}`);
                    newOption.innerHTML = `0${c}`;
                } else {
                    newOption.setAttribute("value", c);
                    newOption.innerHTML = c;
                }
                hourElem.appendChild(newOption);
            }
            for (let c = 0; c < 60; c++) {
                let newOption = document.createElement("option");
                if (c < 10) {
                    newOption.setAttribute("value", `0${c}`);
                    newOption.innerHTML = `0${c}`;
                } else {
                    newOption.setAttribute("value", c);
                    newOption.innerHTML = c;
                }
                minuteElem.appendChild(newOption);
            }
        })();

        // end: adding select options

        // add the register flight functionality

        (async() => {
            let regFlightBtn = document.getElementById("reg-flight");
            regFlightBtn.addEventListener("click", async function() {
                let airlineAddress = document.getElementById("selAddress").value;

                let flightCode = document.getElementById("flightCode").value;
                let flightOrigin = document.getElementById("flightOrigin").value;
                let flightDestination = document.getElementById("flightDestination").value;

                let flightDeptDay = document.getElementById("flightDepartureDay").value;
                let flightDeptHour = document.getElementById("flightHour").value;
                let flightDeptMinute = document.getElementById("flightMinute").value;

                let departureDate = new Date(flightDeptDay + "T" + flightDeptHour + ":" + flightMinute + ":00Z");
                console.log(departureDate);
                try {
                    await contract.registerFlight(airlineAddress, flightCode, flightOrigin, flightDestination, departureDate);
                } catch(err) {
                    console.log(error);
                }

            });
        })();


        (async() => {
            let showAirlinesBtn = document.getElementById("show-airlines");
            showAirlinesBtn.addEventListener("click", showAirlines);
        })();

        // add the 'register airline functionality'
        (() => {
            let registerAirlineBtn = document.getElementById("register-airline");
            registerAirlineBtn.addEventListener("click", async function() {
                let senderAirlineAddr = document.getElementById("selAddress").value;
                let newAirlineAddress = document.getElementById("airlineReg-address").value;
                let newAirlineName = document.getElementById("airlineName").value;
                console.log(senderAirlineAddr);
                console.log(newAirlineAddress);
                console.log(newAirlineName);
                try {
                    await contract.registerAirline(senderAirlineAddr, newAirlineAddress, newAirlineName);
                    contract.airlines.push(newAirlineAddress);
                    console.log(contract.airlines);
                } catch(error) {
                    console.log(error);
                }
            });
        })();

        async function showAirlines() {
            let airlines = contract.airlines;
            let airlinesDisplayElement = document.getElementById("showRegisteredAirlines");
            airlinesDisplayElement.innerHTML = "";
            let table = document.createElement("table");
            let tableHeaders = `
            <tr><th>Address</th>
            <th>Name</th>
            <th>isRegistered</th>
            <th>isFunded</th>
            <th>voteToInclude</th>
            </tr>`;
            table.innerHTML = tableHeaders;
            let numAirlines = await contract.howManyAirlines();
            console.log(Number(numAirlines));
            console.log(contract.airlines);
            for (let c = 0; c < numAirlines; c++) {
                let airlineAddress = contract.airlines[c];
                let airlineInfo = await contract.getAirline(airlineAddress);
                let tableRow = document.createElement("tr");
                let tabledata1 = document.createElement("td");
                tabledata1.innerHTML = airlineAddress;
                let tabledata2 = document.createElement("td");
                tabledata2.innerHTML = airlineInfo[1];
                let tabledata3 = document.createElement("td");
                tabledata3.innerHTML = airlineInfo[2];
                let tabledata4 = document.createElement("td");
                tabledata4.innerHTML = airlineInfo[3];
                tableRow.appendChild(tabledata1);
                tableRow.appendChild(tabledata2);
                tableRow.appendChild(tabledata3);
                tableRow.appendChild(tabledata4);
                if (!airlineInfo[2]) {
                    let tabledata5 = document.createElement("td");
                    let voteBtn = document.createElement("button");
                    voteBtn.innerHTML = "Cast vote!";
            		//detailBtn.setAttribute("id", i+1);
            		voteBtn.addEventListener("click", async function() {
                        // contract.owner is a placeholder --- TO CHANGE
                        let sender = document.getElementById("selAddress").value;
                        await contract.castVote(airlineAddress, sender);
                        alert("Vote cast!");
                    });
                    tabledata5.appendChild(voteBtn);
                    tableRow.appendChild(tabledata5);
                }
                table.appendChild(tableRow);
            }
            airlinesDisplayElement.appendChild(table);
        };

        // async function showFlights() {
        //
        // }

        // add the fund airline function to a button
        (async() => {
            let fundBtn = document.getElementById("fund-airline");
            fundBtn.addEventListener("click", async function() {
                let selectAirlineAddress = document.getElementById("selAddress").value;
                let airlineToBeFunded = document.getElementById("airlineFund-address").value;
                try {
                    alert(`The airline ${airlineToBeFunded} is about to be funded`);
                    await contract.fundAirline(airlineToBeFunded);
                } catch(error) {
                    console.log(error);
                }
            })
        })();



        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });


        // show registered airlines
        //display('Airlines', 'List of available airlines', [ { label: 'Airline', error: error, value: contract.getAvailableAirlines()} ]);
        // contract.getAvailableAirlines((error, result) => {
        //     display('Airlines', 'List of available airlines', [ { label: 'Airline', error: error, value: result} ]);
        // })

        // DOM.elid("showRegAirlines").addEventListener("click"), () => {
        //     let airlinesList = document.getElementById("airlines-list");
        //     console.log(airlinesList);
        //     if(airlinesList.style.visibility == "visible") {
        //         airlinesList.style.visibility = "hidden";
        //     } else if (airlinesList.style.visibility == "hidden") {
        //         airlinesList.style.visibility = "visible";
        //     }
        // };

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            //console.log(flight);
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

    });


})();



function display(title, description, results) {
    console.log(results);
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
