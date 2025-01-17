import { Admin } from "../models/admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../Database/db.js";
import moment from "moment";

export const validateAdmin = (req, res) => {
  try {
    const { empid, password } = req.body;
    const findAdmin = "select * from admin where empid=?";
    db.query(findAdmin, [empid], async (error, results) => {
      if (error) return res.send({ message: "User not Found!!" });

      const verified = await bcrypt.compare(password, results[0].pass);
      if (verified) {
        const token = jwt.sign(results[0].empid, process.env.SECRET_AUTH + "");
        if (results[0].token == token) {
          res.cookie(
            results[0].designation == "M" ? "master" : "admin",
            token,
            {
              expires: new Date(Date.now() + 86400000),
              httpOnly: true,
            }
          );
          return res.send({ ...results, message: "Login Successful" });
        }
      }
    });
  } catch (error) {
    res.status(401).send(error.message);
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { confirmpassword, password } = req.body;
    if (confirmpassword == password) {
      const date = moment().format("YYYY-MM-DD");
      const {
        empid,
        firstname,
        lastname,
        gender,
        department,
        designation,
        phone,
        email,
      } = req.body;
      const token = jwt.sign(empid.toString(), process.env.SECRET_AUTH + "");
      const pass = await bcrypt.hash(password, 10);
      const adminInfo = [
        empid,
        firstname,
        lastname,
        gender,
        department,
        designation,
        phone,
        email,
        date,
        pass,
        token,
      ];
      const newAdmin =
        "Insert into admin( empid, firstname, lastname, gender, department, designation, phone, email, join_date, pass, token ) values (?,?,?,?,?,?,?,?,?,?,?)";
      db.query(newAdmin, adminInfo, (error, result, fields) => {
        if (error) {
          return res.send({
            message: "Admin with that employee id already exist",
          });
        }
        console.log(result);
        res
          .status(201)
          .send({ ...result, message: "Admin created Successfully" });
      });
    } else {
      res.send({ message: "Passwords didn't match!" });
    }
  } catch (error) {
    res.status(409).send({ message: error.message });
  }
};

export const sendReworkDetails = async (req, res) => {
  let complete_reworks = {};
  db.query("Select * from inprocess_defects where inprocess_rework_handler=? and inprocess_rework_status=?", [req.userID, "incomplete"], (error, results) => {
    if (error) return res.status(401).send({ message: "Something is Wrong in inprocess_defects" });
    console.log(results);
    complete_reworks = { inprocess_defects: results };
  });
  db.query("Select * from pdi_defects where pdi_rework_handler=? and pdi_rework_status=?", [req.userID, "incomplete"], (error, results) => {
    if (error) return res.status(401).send({ message: "Something is Wrong in pdi_defects" });
    console.log(results);
    complete_reworks = { ...complete_reworks, pdi_defects: results };
  });
  res.status(201).send(complete_reworks);
}
/*--------------------------Don't uncomment/touch above code---------------------------*/
