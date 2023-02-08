const Web3 = require("web3");
const express = require("express");
const cors = require("cors");
const mysql = require('mysql');
require("dotenv").config();
const app = express();
const http = require("http");
const transactionRouter = require('./Router/transactionRouter')
const CONTRACT_ABI = require('./walletZillaABI.json')
const HDWalletProvider = require("@truffle/hdwallet-provider");

app.use(express.json());
app.use(cors());
app.use('/api', transactionRouter)
const {conn} = require('./Utils/connection')

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const web3 = new Web3("https://endpoints.omniatech.io/v1/bsc/testnet/public");
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);



// function toFixed(x) {
//   if (Math.abs(x) < 1.0) {
//     var e = parseInt(x.toString().split("e-")[1]);
//     if (e) {
//       x *= Math.pow(10, e - 1);
//       x = "0." + new Array(e).join("0") + x.toString().substring(2);
//     }
//   } else {
//     var e = parseInt(x.toString().split("+")[1]);
//     if (e > 20) {
//       e -= 20;
//       x /= Math.pow(10, e);
//       x += new Array(e + 1).join("0");
//     }
//   }
//   return String(x);
// }
// function round(number) {
//   return Math.round(number * 1000) / 1000;
// }

async function generateEventQuery(result) {
  let block_number = 0;
  let csql_arr = [];
  let sql_arr = [];
  if (result.length > 0 && result[0]["returnValues"]) {
    let i = 0,
      j = 0;
    while (result.length > i) {
      let index = Object.keys(result[i]["returnValues"]);
      let event = result[i]["event"];
      var table = event;
    //  console.log("Table Name : ",event);
      // if (event !== undefined ) {
        if (event == 'Invest' || event == 'claimedReward' || event == 'incentiveShared' || event == 'AirdropClaimed' ) {
            let sql = "INSERT INTO `" + table + "`(";
            let vsql = "VALUES (";

            let csql = "select id from `" + table + "`  WHERE ";

            let k = 0;
            while (index.length > k) {
              if (index[k].length > 2) {
                csql +=
                  "`" +
                  index[k] +
                  "`='" +
                result[i]["returnValues"][index[k]] +
                  "' and ";
                sql += "`" + index[k] + "`,";
                vsql += "'" + result[i]["returnValues"][index[k]] + "',";
              }
              k++;
            }
            let tsmp = new Date() * 1; //$result[$i]['block_timestamp'];
            let transaction_id = result[i]["transactionHash"];
            let block_number = result[i]["blockNumber"];
            let timestamp = await getBlocktoTime(result[i]["blockNumber"]);
            csql += " transaction_id='" + transaction_id + "'";
            csql += " and block_number='" + block_number + "'";
            sql += "`block_timestamp`,`transaction_id`,`block_number`)";
            vsql +=
              "'" +
              timestamp +
              "','" +
              transaction_id +
              "','" +
              block_number +
              "')";
            sql += vsql;
            console.log("sql Query ",sql);
            console.log("csql Query ",csql);
            conn.query(csql, function(err,res){
                if(err) throw err;
                if(res.length===0)
                {
                 conn.query(sql,function(err,result){
                    if(err) throw err;
                   // console.log(result);
                });
              }
              });

            csql_arr.push(csql);
            sql_arr.push(sql);
        } else {
            console.log("extra event "+event);
        }
      i++;
    }
  }
  //console.log("Query : ",csql_arr);
  return { csql: csql_arr, sql: sql_arr ,result};
}
function getBlocktoTime(block) {
  return new Promise((resolve, reject) =>
    web3.eth
      .getBlock(block)
      .then((d) => resolve(d.timestamp))
      .catch((e) =>reject(e))
  );
}
 app.get("/event_api/", async (req, res) => {
//setInterval(() => {
    console.log("StakeNode");
  conn.query("select * from event_block_nodes",function (err,result){
      if (err) throw err;
     web3.eth.getBlockNumber()
      .then((d) => {
        let current_block = d;
      console.log("Query Evet Block",result[0].latest_block);
      console.log("Current Block",current_block);
      contract.getPastEvents({
        fromBlock: Number(result[0].latest_block),
        toBlock: Number(result[0].latest_block)+100,
      })
      .then( async(events) => {
      let resu = await generateEventQuery(events);
      if(parseInt(result[0].latest_block)+100<parseInt(current_block)){
          conn.query(`UPDATE event_block_nodes SET latest_block ='${parseInt(result[0].latest_block)+100}'`,function(err,result){
              if (err) throw err;

          })
      }
      })
      .catch((e) => {
          console.log("Err",e)

      });
      })
      .catch((e) =>{
          console.log("Err",e)

      } );
    })

  });

app.listen(5654);

console.log("go");
