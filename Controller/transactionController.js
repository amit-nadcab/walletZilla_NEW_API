
const { conn } = require('../Utils/connection')
const moment  = require('moment')

exports.getDepositList = async (req, res) => {
    try {
        const { userAddress } = req.body
        conn.query(`SELECT * FROM  Invest WHERE userAddress='${userAddress}'`, (err, result) => {
            if (err) {
                console.log("Error", err);
                throw err
            }
            console.log(result.length, "a");
            res.json({
                status: 200,
                data: result,
                message: result.length > 0 ? "succesful" : "User Not Found"
            })
        })
    } catch (error) {
        console.log(error);
    }
}
exports.getWithdrawList = async (req, res) => {
    try {
        const { userAddress } = req.body
        conn.query(`SELECT * FROM  claimedReward WHERE userAddress='${userAddress}'`, (err, result) => {
            if (err) {
                console.log("Error", err);
                throw err
            }
            res.json({
                status: 200,
                data: result,
                message: result.length > 0 ? "succesful" : "User Not Found"
            })
        })
    } catch (error) {

    }
}
exports.getAirdropList = async (req, res) => {
    try {
        const { userAddress } = req.body
        conn.query(`SELECT * FROM  AirdropClaimed WHERE userAddr='${userAddress}'`, (err, result) => {
            if (err) {
                console.log("Error", err);
                throw err
            }
            res.json({
                status: 200,
                data: result,
                message: result.length > 0 ? "succesful" : "User Not Found"
            })
        })
    } catch (error) {
        console.log(error);
    }
}
exports.getLevelIncome = async (req, res) => {
    try {
        const { userAddress } = req.body
        conn.query(`SELECT * FROM  incentiveShared WHERE addressOfuser='${userAddress}'`, (err, result) => {
            if (err) {
                console.log("Error", err);
                throw err
            }
            res.json({
                status: 200,
                data: result,
                message: result.length > 0 ? "succesful" : "User Not Found"
            })
        })
    } catch (error) {
        console.log(error);
    }
}
exports.getLevel = async (req, res) => {
    try {
        const { userAddress, level } = req.body;
        const a = await level_wise_member(userAddress, level)
        console.log(a, "response");
    } catch (error) {
        console.log(error);
    }
}
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
        })
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
                                    resolve(result)
                                
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
            console.log(levels[i][0].userAddress,levels.length,i,"Address");
            conn.query(`SELECT SUM(amount) AS amount FROM incentiveShared WHERE claimBy='${levels[i][0].userAddress}' AND addressOfuser='${userAddress}'`, (err, result1) => {
                  
                const res1 = levels[i].map((it, i) => {
                    const obj = { ...it, amount: result1[i] ? result1[i].amount : 0 }
                    return obj
                })
                console.log(result1,"OBJ");
                levels[i] = res1
               result[`level_${i + 1}`] = levels[i].length > 0 ? levels[i] : [];
               if( i == levels.length -1){
                res.json({
                    data: result
                })
               }
            })
        }

    } catch (err) {
        res.status(500).json({
            message: "An error occurred while fetching the team data.",
            error: err,
        });
    }
};
exports.dailyTopDepositer = async(req, res)=>{
    try {
        // const date = parseInt((moment().add(-1,'days').valueOf())/1000)
        const a = moment().add(-1,'days').format('YYYY-MM-DD')
        let start = a +" 12:00:00"
        let end = a + " 23:59:00"
        start = parseInt((moment(start).valueOf())/1000);
        end = parseInt((moment(end).valueOf())/1000);

         conn.query(`SELECT SUM(AmountInv) as AmountInv FROM Invest WHERE block_timestamp <= ${end} AND block_timestamp >= ${start}`,(err,totalIncome)=>{
            if(err) throw err
            if(totalIncome){
                 const userIncome = ((totalIncome[0].AmountInv*2)/100)/5 
                 conn.query(`SELECT * FROM Invest WHERE  block_timestamp <= ${end} AND block_timestamp >= ${start} ORDER BY AmountInv DESC LIMIT 5`,(err, users)=>{
                        if(err) throw err
                        if(users){
                            let query = 'INSERT INTO DailyTopDepositor (userAddress, income, date) VALUES '
                            users.map((e,i)=>{
                               query+= `('${e.userAddress}', '${userIncome}', '${parseInt((moment().valueOf())/1000)}')`;
                               if(i !=users.length -1 ){
                                query += ","
                               }
                            })
                            console.log(query);
                            conn.query(query,(err, result)=>{
                                if(err) throw err
                                if(result){
                                    res.json({
                                        message: "INSERT SUCESSFUL"
                                    })
                                }
                            })
                        }
                    })
            }
         })   
        
    } catch (error) {
        console.log(error);
    }
}
exports.getDailyDepositor = async(req, res)=>{
    try {   
        const {userAddress, date} = req.body
        const a = moment(date).format('YYYY-MM-DD')
        let start = a +" 12:00:00"
        let end = a + " 23:59:00"
        start = parseInt((moment(start).valueOf())/1000);
        end = parseInt((moment(end).valueOf())/1000);
        let query;
        if(userAddress && date){
            query = `SELECT * FROM DailyTopDepositor WHERE userAddress='${userAddress}' AND (date >= '${start}' AND date <= '${end}')`
        } else if(userAddress){
            query = `SELECT * FROM DailyTopDepositor WHERE userAddress='${userAddress}'`
        }else if(date){
            query = `SELECT * FROM DailyTopDepositor WHERE date >= '${start}' AND date <= '${end}'`
        }
        console.log(query);
        conn.query(query,(err, result)=>{
            if(err){
                res.json({
                    data: err,
                    message: "Error"
                })
            }
            if(result){
                res.json({
                    data: result,
                    message:  result.length > 0 ?  "Sucessfull" : "No Data Found"
                })
            }
        })
    } catch (error) {
        console.log(error);
    }
}
exports.getTeamBusiness = async(req, res)=>{
    try {
        const {userAddress} = req.body;
        conn.query(`SELECT teamBusiness FROM RegNewuser WHERE userAddress='${userAddress}'`, (err, result)=>{
            if(err) throw err
            if(result){
                res.json({
                    data: result,
                    message: result.length > 0 ? "Successful" : "No Data Found"
                })
            }
        })
    } catch (error) {
        console.log(error);
    }
}
exports.managerIncome = async(req, res)=>{
    try {

        const prevSunday = moment(moment('2023-02-06')).startOf('week');
        const nextSunday = moment(moment('2023-02-06')).endOf('week').add(1,'day');

        const start = parseInt(prevSunday.valueOf()/1000)
        const end = parseInt(nextSunday.valueOf()/1000)
        // console.log(parseInt(prevSunday.valueOf()/1000));
        // console.log(parseInt(nextSunday.valueOf()/1000));
        conn.query(`SELECT SUM(AmountInv) as AmountInv FROM Invest WHERE block_timestamp <= '${end}' AND block_timestamp >= '${start}'`,(err, result)=>{
            if(err) throw err
            if(result){
                res.json({
                    data: result
                })
            }

        })

        // conn.query(`SELECT teamBusiness FROM RegNewuser WHERE userAddress='${userAddress}'`, (err, result)=>{
        //     if(err) throw err
        //     if(result){
        //         res.json({
        //             data: result,
        //             message: result.length > 0 ? "Successful" : "No Data Found"
        //         })
        //     }
        // })
    } catch (error) {
        console.log(error);
    }
}

exports.transferIncome = async(req, res)=>{
    try {
        
    } catch (error) {
        
    }
}







// exports.manegerIncome = async(req, res)=>{
//     try {
        
//     } catch (error) {
//         console.log(error);
//     }
// }
// app.post('/transfer-rewards', (req, res) => {
//     const { userId } = req.body;
   
//     connection.query(`SELECT count(*) as referral_count FROM referrals WHERE referrer_id = ${userId}`,(err, referralCount) => {
//         if (err) throw err;
  
//         if (referralCount[0].referral_count >= 5) {
//           connection.query(
//             `SELECT sum(business) as team_business
//             FROM users
//             WHERE referrer_id = ${userId}`,
//             (err, teamBusiness) => {
//               if (err) throw err;
  
//               if (teamBusiness[0].team_business >= 15000) {
//                 connection.query(
//                   `SELECT count(*) as team_size
//                   FROM users
//                   WHERE referrer_id = ${userId}`,
//                   (err, teamSize) => {
//                     if (err) throw err;
  
//                     if (teamSize[0].team_size >= 50) {
//                       connection.query(
//                         `SELECT self_investment
//                         FROM users
//                         WHERE id = ${userId}`,
//                         (err, selfInvestment) => {
//                           if (err) throw err;
  
//                           if (selfInvestment[0].self_investment >= 1000) {
//                             connection.query(
//                               `SELECT sum(business) as total_turnover
//                               FROM users`,
//                               (err, totalTurnover) => {
//                                 if (err) throw err;
  
//                                 const reward = totalTurnover[0].total_turnover * 0.01;
  
//                                 connection.query(
//                                   `UPDATE users
//                                   SET rewards = rewards + ${reward}
//                                   WHERE id = ${userId}`,
//                                   (err) => {
//                                     if (err) throw err;
  
//                                     res.send({ message: 'Rewards transferred successfully' });
//                                   }
//                                 );
//                               }
//                             );
//                           } else {
//                             res.status(400).send({ message: 'Self investment is less than 1000' });
//                           }
//                         }
//                       );
//                     } else {
//                       res.status(400).send({ message: 'Team size is less than 50' });
//                     }
//                   }
//                 );
//               } else {
//                 res.status(400).send({ message: 'Team business is less then 15000'})
//               }

//             })

