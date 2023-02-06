const { conn } = require("../Utils/connection");
const moment = require("moment");
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
let provider = new HDWalletProvider("424b0dde8d24fffb6888a8e22b75978cd0392e8b73da9807096d4a6d43b259ac", "https://endpoints.omniatech.io/v1/bsc/testnet/public");
const web3 = new Web3(provider);
const ABI = require("../walletZillaABI.json");
const CONTRACT_ADDRESS = "0xC5B53A5d0fF79a77449650f15821da6F3C0ec102";
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

exports.getDepositList = async (req, res) => {
    try {
        const { userAddress } = req.body;
        conn.query(
            `SELECT * FROM  Invest WHERE userAddress='${userAddress}'`,
            (err, result) => {
                if (err) {
                    console.log("Error", err);
                    throw err;
                }
                console.log(result.length, "a");
                res.json({
                    status: 200,
                    data: result,
                    message: result.length > 0 ? "succesful" : "User Not Found",
                });
            }
        );
    } catch (error) {
        console.log(error);
    }
};
exports.getWithdrawList = async (req, res) => {
    try {
        const { userAddress } = req.body;
        conn.query(
            `SELECT * FROM  claimedReward WHERE userAddress='${userAddress}'`,
            (err, result) => {
                if (err) {
                    console.log("Error", err);
                    throw err;
                }
                res.json({
                    status: 200,
                    data: result,
                    message: result.length > 0 ? "succesful" : "User Not Found",
                });
            }
        );
    } catch (error) { }
};
exports.getAirdropList = async (req, res) => {
    try {
        const { userAddress } = req.body;
        conn.query(
            `SELECT * FROM  AirdropClaimed WHERE userAddr='${userAddress}'`,
            (err, result) => {
                if (err) {
                    console.log("Error", err);
                    throw err;
                }
                res.json({
                    status: 200,
                    data: result,
                    message: result.length > 0 ? "succesful" : "User Not Found",
                });
            }
        );
    } catch (error) {
        console.log(error);
    }
};
exports.getLevelIncome = async (req, res) => {
    try {
        const { userAddress } = req.body;
        conn.query(
            `SELECT * FROM  incentiveShared WHERE addressOfuser='${userAddress}'`,
            (err, result) => {
                if (err) {
                    console.log("Error", err);
                    throw err;
                }
                res.json({
                    status: 200,
                    data: result,
                    message: result.length > 0 ? "succesful" : "User Not Found",
                });
            }
        );
    } catch (error) {
        console.log(error);
    }
};
exports.getLevel = async (req, res) => {
    try {
        const { userAddress, level } = req.body;
        const a = await level_wise_member(userAddress, level);
        console.log(a, "response");
    } catch (error) {
        console.log(error);
    }
};
exports.getMyTeam = async (req, res) => {
    const { userAddress } = req.body;
    try {
        let levels = [];
        const myfirstlevel = await new Promise((resolve, reject) => {
            conn.query(
                `select * from RegNewuser where RefByAddress='${userAddress}'`,
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
        levels.push(myfirstlevel);

        for (let i = 0; i < 9; i++) {
            let nextLevel = [];
            for (const element of levels[i]) {
                const result = await new Promise((resolve, reject) => {
                    conn.query(
                        `select * from RegNewuser where RefByAddress='${element.userAddress}'`,
                        (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                });
                nextLevel = nextLevel.concat(result);
            }
            levels.push(nextLevel);
        }
        let result = {};
        for (let i = 0; i < levels.length; i++) {
            // if( i == 0)
            console.log(levels[i][0].userAddress, levels.length, i, "Address");
            conn.query(
                `SELECT SUM(amount) AS amount FROM incentiveShared WHERE claimBy='${levels[i][0].userAddress}' AND addressOfuser='${userAddress}'`,
                (err, result1) => {
                    const res1 = levels[i].map((it, i) => {
                        const obj = { ...it, amount: result1[i] ? result1[i].amount : 0 };
                        return obj;
                    });
                    console.log(result1, "OBJ");
                    levels[i] = res1;
                    result[`level_${i + 1}`] = levels[i].length > 0 ? levels[i] : [];
                    if (i == levels.length - 1) {
                        res.json({
                            data: result,
                        });
                    }
                }
            );
        }
    } catch (err) {
        res.status(500).json({
            message: "An error occurred while fetching the team data.",
            error: err,
        });
    }
};
//DailyTopDepositor
exports.dailyTopDepositer = async (req, res) => {
    try {
        // const date = parseInt((moment().add(-1,'days').valueOf())/1000)
        const a = moment().add(-1, "days").format("YYYY-MM-DD");
        let start = a + " 12:00:00";
        let end = a + " 23:59:00";
        start = parseInt(moment(start).valueOf() / 1000);
        end = parseInt(moment(end).valueOf() / 1000);
        console.log(start, end);

        conn.query(`SELECT * FROM Invest WHERE  block_timestamp <= ${end} AND block_timestamp >= ${start} ORDER BY AmountInv DESC LIMIT 5`, (err, users) => {
            if (err) {
                res.json({
                    status: 400,
                    error: err
                })
            }
            if (users.length > 0) {
                conn.query(`SELECT SUM(AmountInv) as AmountInv FROM Invest WHERE block_timestamp <= '${end}' AND block_timestamp >= '${start}'`, (err, totalIncome) => {
                    if (err) {
                        res.json({
                            status: 400,
                            error: err
                        })
                    }
                    if (totalIncome[0].AmountInv !== null) {
                        const userIncome = (totalIncome[0].AmountInv * 2) / 100 / users.length;
                        if (users) {
                            let query =
                                "INSERT INTO DailyTopDepositor (userAddress, income, date) VALUES ";
                            users.map((e, i) => {
                                query += `('${e.userAddress}', '${userIncome}', '${parseInt(
                                    moment().valueOf() / 1000
                                )}')`;
                                if (i != users.length - 1) {
                                    query += ",";
                                }
                            });
                            console.log(query);
                            conn.query(query, (err, result) => {
                                if (err) throw err;
                                if (result) {
                                    res.json({
                                        message: "INSERT SUCESSFUL",
                                    });
                                }
                            });
                        }
                    }
                })
            }
        })

    } catch (error) {
        console.log(error);
    }
};
exports.getDailyDepositor = async (req, res) => {
    try {
        const { userAddress, date } = req.body;
        const a = moment(date).format("YYYY-MM-DD");
        let start = a + " 12:00:00";
        let end = a + " 23:59:00";
        start = parseInt(moment(start).valueOf() / 1000);
        end = parseInt(moment(end).valueOf() / 1000);
        let query;
        if (userAddress && date) {
            query = `SELECT * FROM DailyTopDepositor WHERE userAddress='${userAddress}' AND (date >= '${start}' AND date <= '${end}')`;
        } else if (userAddress) {
            query = `SELECT * FROM DailyTopDepositor WHERE userAddress='${userAddress}'`;
        } else if (date) {
            query = `SELECT * FROM DailyTopDepositor WHERE date >= '${start}' AND date <= '${end}'`;
        }
        console.log(query);
        conn.query(query, (err, result) => {
            if (err) {
                res.json({
                    data: err,
                    message: "Error",
                });
            }
            if (result) {
                res.json({
                    data: result,
                    message: result.length > 0 ? "Sucessfull" : "No Data Found",
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
};
exports.getTodaysTopDepositor = async (req, res) => {
    try {
        const a = moment().format("YYYY-MM-DD");
        const b = moment().format("YYYY-MM-DD HH:mm:ss");
        let start = a + " 12:00:00";

        start = parseInt(moment(start).valueOf() / 1000);
        end = parseInt(moment(b).valueOf() / 1000);
        console.log(start, end, a);
        conn.query(`SELECT * FROM Invest WHERE block_timestamp <= '${end}' AND block_timestamp >= '${start}'`,(err,result)=>{
            if(err){
                res.json({
                    status: 400,
                    error: err
                })
            }
            if(result.length > 0){
                res.json({
                    data: result,
                    message: "Successful"
                })
            }else{
                res.json({
                    data: result,
                    message: "No data Found"
                })
            }
        })
    } catch (error) {
        res.json({
            status: 400,
            error: error
        })
    }
}
exports.getTeamBusiness = async (req, res) => {
    try {
        const { userAddress } = req.body;
        conn.query(
            `SELECT teamBusiness FROM RegNewuser WHERE userAddress='${userAddress}'`,
            (err, result) => {
                if (err) throw err;
                if (result) {
                    res.json({
                        data: result,
                        message: result.length > 0 ? "Successful" : "No Data Found",
                    });
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
};
// Manager Income
exports.managerIncome = async (req, res) => {
    try {

        const accounts = await web3.eth.getAccounts()

        const prevSunday = moment(moment()).startOf("week");
        const nextSunday = moment(moment()).endOf("week").add(1, "day");

        const start = parseInt(prevSunday.valueOf() / 1000);
        const end = parseInt(nextSunday.valueOf() / 1000);
        console.log(start);
        console.log(end);
        conn.query(
            `SELECT SUM(AmountInv) as AmountInv FROM Invest WHERE block_timestamp <= '${end}' AND block_timestamp >= '${start}'`,
            (err, turnOver) => {
                console.log(moment().format("YYYY-MM-DD"));
                if (err) throw err;
                if (turnOver[0].AmountInv !== null) {
                    conn.query(
                        `SELECT * FROM RegNewuser WHERE royalityRank='MANAGER' AND royalityexpiryDate >= '${moment().format("YYYY-MM-DD")}'`,
                        (err, result) => {
                            if (err) throw err;
                            if (result) {
                                console.log(result);
                                const managerIncome = (((turnOver[0].AmountInv * 1) / 100) / result.length);
                                const uAddress = result.map((e, i) => {
                                    return e.userAddress
                                })
                                console.log(uAddress, managerIncome);
                                contract.methods.SetManagerIncome(uAddress, managerIncome.toString()).send({ from: accounts[0], value: 0 }).then((res) => {
                                    console.log(res.status);
                                    if (res.status) {
                                        res.json({
                                            data: result,
                                            totalMember: result.length,
                                            turnOver: turnOver,
                                            income: managerIncome / 1e18,
                                            message: "Sucessfull",
                                        });
                                    }
                                   
                                }).catch((err) => {
                                    res.json({
                                        message: err
                                    })
                                })
                            }
                        }
                    );
                } else {
                    res.json({
                        message: "no data found",
                        data: 0,
                    });
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
};
// Senior Manager Income
exports.seniorManagerIncome = async (req, res) => {
    try {
        const accounts = await web3.eth.getAccounts()
        const prevSunday = moment(moment()).startOf("week");
        const nextSunday = moment(moment()).endOf("week").add(1, "day");

        const start = parseInt(prevSunday.valueOf() / 1000);
        const end = parseInt(nextSunday.valueOf() / 1000);
        console.log(start);
        console.log(end);
        conn.query(
            `SELECT SUM(AmountInv) as AmountInv FROM Invest WHERE block_timestamp <= '${end}' AND block_timestamp >= '${start}'`,
            (err, turnOver) => {
                console.log(turnOver,"turnOver");
                if (err) throw err;
                if (turnOver[0].AmountInv !== null) {
                    conn.query(
                        `SELECT * FROM RegNewuser WHERE royalityRank='SR. MANAGER' AND royalityexpiryDate >= '${moment().format("YYYY-MM-DD")}'`,
                        (err, result) => {
                            if (err) throw err;
                            if (result) {
                                const managerIncome = (((turnOver[0].AmountInv * 1) / 100) / result.length);
                                console.log(managerIncome,'managerIncome');
                                const uAddress = result.map((e, i) => {
                                    return e.userAddress
                                })
                                console.log(uAddress);
                                contract.methods.SetSenManagerIncome(uAddress,managerIncome.toString()).send({ from: accounts[0], value: 0 }).then((res) => {
                                    if (res.status) {
                                        res.json({
                                            data: result,
                                            totalMember: result.length,
                                            turnOver: turnOver,
                                            income: managerIncome / 1e18,
                                            message: "Sucessfull",
                                        });
                                    }
                                    
                                }).catch((err) => {
                                    res.json({
                                        message: err
                                    })
                                })
                            }
                        }
                    );
                } else {
                    res.json({
                        message: "no data found",
                        data: 0,
                    });
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
};

exports.getManagerIncome = async(req, res)=>{
    try {
        const {userAddress} = req.body;
        conn.query(`SELECT * FROM royalityIncome WHERE userAddress ='${userAddress}'`, (err, result)=>{
            if(err){
                res.json({
                    status: 400,
                    error: err
                })
            }
            if(result !=null){
                console.log(result);
                res.json({
                    status: 200,
                    data: result
                })
            }else{
                res.json({
                    status: 400,
                    data: result
                })
            }
        })
    } catch (error) {
        
        console.log(error);
    }
}




