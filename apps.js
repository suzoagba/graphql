const loginFormElement = document.getElementById('loginFormElement');
const profileElement = document.getElementById('profileElement');
const graph1Element = document.getElementById('graph1Element');
const graph2Element = document.getElementById('graph2Element');

loginFormElement.addEventListener('submit', (event) => {
    event.preventDefault();
    const usernameValue = document.getElementById('username').value;
    const passwordValue = document.getElementById('password').value;
    authorizeUser(usernameValue, passwordValue, "https://01.kood.tech/api/auth/signin");
});

async function authorizeUser(username, password, url) {
    const authRequest = {
        method: 'POST',
        headers: {
            Authorization: `Basic ` + btoa(`${username}:${password}`)
        }
    };

    let response = await getServerResponse(authRequest, url);

    if (response && response !== 0) {
        loginFormElement.style.display = 'none';
        localStorage.setItem('accessToken', response);
        fetchData(response, 'https://01.kood.tech/api/graphql-engine/v1/graphql');
    } else {
        document.getElementById("failed-login").innerHTML = `Username or password do not match or exist. Try again`;
    }
}

async function getServerResponse(request, url) {
    let response = await fetch(url, request);
    if (response.ok) {
        let jsonResponse = await response.json();
        return jsonResponse;
    } else return 0;
}

async function fetchData(token, url) {
    const graphqlRequest = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            query: userQuery
        })
    };

    let userResponse = await getServerResponse(graphqlRequest, url);

    if (userResponse && userResponse !== 0) {
        decipherUserData(userResponse);
    } else {
        console.error("failed graphql request");
    }
}

let userQuery = `
    query {
        user {
            id
            login
            attrs
            auditRatio
            totalDown
            totalUp
            transactions(where: {event: {id: {_eq: 85}}}) {
                type
                amount
                object {
                    name
                }
            }
        }
    }`;

function decipherUserData(userResponse) {
    console.log(userResponse.data);
    const {user} = userResponse.data; //object destructuring
    const userData = user[0].attrs;
    const ID = user[0].id;

    document.body.style.backgroundColor = "#000000";

    profileElement.innerHTML += `
        <h1>Hi, ${userData.firstName}!</h1>
        <label>Student: ${userData.firstName} ${userData.lastName}</label><br>
        <label>Profile ID: ${ID}</label><br>
        <label>Gender: ${userData.gender}</label><br>
        <label>Nationality: ${userData.nationality}</label><br>
        <label>City: ${userData.addressCity}</label><br>
        <label>Tel: ${userData.tel}</label><br>
        <label>Email: ${userData.email}</label><br>
        `   

    let logoutContainer = document.createElement('div');
    logoutContainer.style.position = 'absolute';
    logoutContainer.style.top = '0';
    logoutContainer.style.right = '0';
    profileElement.appendChild(logoutContainer);

    let logoutButton = document.createElement('button');
    logoutButton.className = 'btnlogin';
    logoutButton.type = 'submit';
    logoutButton.id = 'logout';
    logoutButton.innerText = 'Logout';
    logoutButton.style.borderRadius = '5px';
    logoutButton.style.padding = '10px 20px';
    logoutButton.style.backgroundColor = '#e8491d';
    logoutButton.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });
    logoutContainer.appendChild(logoutButton);

    let auditRatio = user[0].auditRatio;
    let auditsDone = user[0].totalUp;
    let auditsReceived = user[0].totalDown;
    displayAuditRatioChart(auditsDone, auditsReceived, auditRatio);

    const projects = Object.values(user[0].transactions);
    let totalXP = 0;
    let points = [], names = [];
    projects.forEach(({type, amount, object}) => {
        if (type === 'xp') {
            names.push(object.name);
            totalXP += amount;
            points.push(amount);
        }
    });
    displayProjectsGraph(names, points, totalXP);
}

function displayAuditRatioChart(done, received, ratio) {
    graph1Element.innerHTML += `
        <figure class="highcharts-figure">
            <div id="container1"></div>
        </figure>
    `;

    Highcharts.chart('container1', {
        chart: {
            backgroundColor: 'transparent',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie',
            spacing: [0, 0, 0, 0], 
        },
        title: {
            text: `<span style="font-size: 20px">Current Audit Ratio: ${Math.round(ratio * 10) / 10}</span>`,
            align: 'center',
            style: {
                color: 'white',
                fontWeight: "bold"
            }
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y}</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                innerSize: '50%', // Create a hole to make it a donut chart
                dataLabels: {
                    enabled: true,
                    format: '<span style="color:white; font-size: 18px;">{point.name}</span>',
                    style: {
                        textOutline: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Bytes',
            colorByPoint: true,
            data: [{
                name: 'Audits Done',
                y: done,
                sliced: true,
                selected: true
            }, {
                name: 'Audits Received',
                y: received
            }],
            colors: [
                '#a5ea8e',
                '#e8acda'
            ]
        }]
    });
}

function displayProjectsGraph(names, points, totalXP) {
    let data = [];
    for (let i = 0; i < names.length; i++) {
        data.push([names[i], points[i]]);
    }
    console.log(data);
    graph2Element.innerHTML += `
        <figure class="highcharts-figure">
            <div id="container2"></div>
        </figure>
    `;
    Highcharts.chart('container2', {
        graph: {
            backgroundColor: 'transparent',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'column'
        },
        title: {
            text: `<span style="font-size: 20px"> Completed Projects : ${names.length}<br/> Accumulated XP: ${totalXP} bytes</span>`,
            align: 'center',
            style: {
                color: 'navy',
                fontWeight: "bold"
            }
        },
        xAxis: {
            type: 'category',
            labels: {
                rotation: -45,
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif',
                    color: 'navy'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Accumulated XP',
                style: {
                    color: 'navy'
                }
            },
            labels: {
                style: {
                    color: 'navy'
                }
            }
        },
        series: [{
            name: 'XP',
            colors: [
                '#9b20d9', '#9215ac', '#861ec9', '#7a17e6', '#7010f9', '#691af3',
                '#6225ed', '#5b30e7', '#533be1', '#4c46db', '#4551d5', '#3e5ccf',
                '#3667c9', '#2f72c3', '#277dbd', '#1f88b7', '#1693b1', '#0a9eaa',
                '#03c69b', '#00f194'
            ],
            colorByPoint: true,
            groupPadding: 0,
            data: data
        }]
    });
}
