
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    //console.log("test");


    let contract = new Contract('localhost', () => {


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
            } catch(e) {
                console.log(e);
            }
        })();

        // register all the airlines from the initial list
        (async() => {
            var owner = contract.owner;
            let initialAirlineNames = ["Beta airlines",
                                        "Gamma airlines",
                                        "Globetrotter airlines"
                                    ];
            let numAirlines = await contract.howManyAirlines();
            console.log(Number(numAirlines));
            //console.log(initialAirlineNames.length);
            try {
                await contract.registerAirline(owner, contract.airlines[1], initialAirlineNames[0]);
                console.log(`Airline ${initialAirlineNames[0]} is being registered...`);
                await contract.registerAirline(owner, contract.airlines[2], initialAirlineNames[1]);
                console.log(`Airline ${initialAirlineNames[1]} is being registered...`);
                await contract.registerAirline(owner, contract.airlines[3], initialAirlineNames[2]);
                console.log(`Airline ${initialAirlineNames[2]} is being registered...`);
                numAirlines = await contract.howManyAirlines();
                console.log(Number(numAirlines));
            } catch(error) {
                console.log("There was an error");
                console.log(error);
            }

            // for(let c = 0; c < initialAirlineNames.length; c++) {
            //
            // }

        })();

        // add the selector options with all the airlines
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
            let allUsers = contract.airlines.concat(contract.passengers).concat(contract.users);
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
            let allUsers = contract.airlines.concat(contract.passengers).concat(contract.users);
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
            let showAirlinesBtn = document.getElementById("show-airlines");
            showAirlinesBtn.addEventListener("click", showAirlines);
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
            		voteBtn.addEventListener("click", function() {
                        // contract.owner is a placeholder --- TO CHANGE
                        contract.castVote(airlineAddress, contract.owner);
                    });
                    tabledata5.appendChild(voteBtn);
                    tableRow.appendChild(tabledata5);
                }
                table.appendChild(tableRow);
            }
            airlinesDisplayElement.appendChild(table);
        };



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
