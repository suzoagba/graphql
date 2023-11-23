const loginFormElement = document.getElementById('login')
const profileElement = document.getElementById('profile')
const graph1Element = document.getElementById('graph1')
const graph2Element = document.getElementById('graph2')

loginFormElement.addEventListener('submit', (event) => {
    event.preventDefault()
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    authenticateUser(username, password, "https://01.kood.tech/api/auth/signin")
})

async function authenticateUser(username, password, url) {
    const authRequest = {
        method: 'POST',
        headers: {
            Authorization: `Basic ` + btoa(`${username}:${password}`)
        }
    }

    let response = await getResponse(authRequest, url)

    if (response && response != 0) {
        loginFormElement.style.display = 'none'
        localStorage.setItem('accessToken', response)
        fetchData(response, 'https://01.kood.tech/api/graphql-engine/v1/graphql')
    } 
    else {
        document.getElementById("failed-login").innerHTML = `Username or password do not match or exist. Try again`
    }
}

async function getResponse(request, url) {
    let response = await fetch(url, request)
    if (response.ok) {
        let jsonResponse = await response.json()
        return jsonResponse
    } else return 0
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
    }

    let userResponse = await getResponse(graphqlRequest, url)

    if (userResponse && userResponse != 0) {
        processUserData(userResponse)
    }
    else console.error("failed graphql request")
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
                }`

function processUserData(userResponse) {
    const userData = userResponse.data.user[0].attrs
    document.body.style.backgroundColor="#000000"
    profileElement.innerHTML += `
        <h1>Welcome, ${userData.firstName} ${userData.lastName}!</h1>
        <label>Name: ${userData.firstName} ${userData.lastName}</label><br>
        <label>Date Of Birth: ${new Date(userData.dateOfBirth).toLocaleDateString()}</label><br>
        <label>Country: ${userData.addressCountry}</label><br>
        <label>City: ${userData.addressCity}</label><br>
        <button class="btnlogin" type="submit" id="logout">Logout</button>
    `
    let logoutElement = document.getElementById('logout')
    logoutElement.addEventListener('click', () => {
        localStorage.clear()
        window.location.reload()
    })

    let auditRatio = userResponse.data.user[0].auditRatio;
    let auditsDone = userResponse.data.user[0].totalUp
    let auditsReceived = userResponse.data.user[0].totalDown
    generateAuditRatioChart(auditsDone, auditsReceived, auditRatio)

    const projects = Object.values(userResponse.data.user[0].transactions)
    let totalXP = 0
    let points = [], names = []
    projects.forEach((item) => {if (item.type === 'xp') {
        totalXP += item.amount
        points.push(item.amount)
        names.push(item.object.name)
    }});
    generateProjectsChart(names, points, totalXP)
}

function generateAuditRatioChart(done, received, ratio){
    graph1Element.innerHTML += `
        <figure class="highcharts-figure">
            <div id="container1"></div>
        </figure>
    `

    Highcharts.chart('container1', {
        chart: {
            backgroundColor: 'transparent',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
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
                '#9cffcb',
                '#dcff9c'
            ]
        }]
    });
}

function generateProjectsChart(names, points, totalXP){
    let data = []
    for(let i = 0; i < names.length; i++){
        data.push([names[i], points[i]])
    }
    console.log(data)
    graph2Element.innerHTML += `
        <figure class="highcharts-figure">
            <div id="container2"></div>
        </figure>
    `
    Highcharts.chart('container2', {
        chart: {
            backgroundColor: 'transparent',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'column'
        },
        title: {
            text: `<span style="font-size: 20px">Projects Completed: ${names.length}<br/>Total XP: ${totalXP} bytes</span>`,
            align: 'center',
            style: {
                color: 'white',
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
                    color: 'white'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Project XP',
                style: {
                    color: 'white'
                }
            },
            labels: {
                style: {
                    color: 'white'
                }
            }
        },
        series: [{
            name: 'XP',
            colors: [
                '#9b20d9', '#9215ac', '#861ec9', '#7a17e6', '#7010f9', '#691af3',
                '#6225ed', '#5b30e7', '#533be1', '#4c46db', '#4551d5', '#3e5ccf',
                '#3667c9', '#2f72c3', '#277dbd', '#1f88b7', '#1693b1', '#0a9eaa',
                '#03c69b',  '#00f194'
            ],
            colorByPoint: true,
            groupPadding: 0,
            data: data
        }]
    });
}