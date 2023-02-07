const express = require("express");
const router = express.Router();

const {
  getDepositList,
  getWithdrawList,
  getAirdropList,
  getLevelIncome,
  getMyTeam,
  dailyTopDepositer,
  getDailyDepositor,
  getTeamBusiness,
  managerIncome,
  seniorManagerIncome,
  getTodaysTopDepositor,
  getManagerIncome,
  getMyReferrals,
} = require("../Controller/transactionController");

router.post("/getDepositList", getDepositList);
router.post("/getWithdrawList", getWithdrawList);
router.post("/getAirdropList", getAirdropList);
router.post("/getLevelIncome", getLevelIncome);
// router.get("/getAllDepositList",getAllDepositList);
router.get("/dailyTopDepositer", dailyTopDepositer);
router.post("/getDailyDepositor", getDailyDepositor);
router.post("/getMyTeam", getMyTeam);
router.post("/getTeamBusiness", getTeamBusiness);
router.get("/managerIncome", managerIncome);
router.get("/seniorManagerIncome", seniorManagerIncome);
router.get("/getTodaysTopDepositor", getTodaysTopDepositor);
router.post("/getManagerIncome", getManagerIncome);

router.post("/getMyReferrals", getMyReferrals);
module.exports = router;
