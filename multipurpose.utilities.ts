import { Request, Response } from "express";
import logger from "./logger.utilities";

// * Fucntion for clean the object with null or undefined or empty string
const replaceUndefinedOrNull = (key: any, value: any) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return value;
};

// * Function for fine the next of some field in any collections
const findNextId = async (model: any, field: string) => {
  let getMaxId: any = await model
    .find({}, { [field]: 1 + 1, _id: 0 })
    .sort({ [field]: -1 })
    .limit(1);

  let nextId = (getMaxId[0][field] += 1);
  return nextId;
};

// * Set default return when no data found
const noDataReturn = (keyname: string) => {
  let result = {
    _metadata: {
      total: 0,
      page: 1,
      pages: 1,
    },
    [keyname]: [],
  };

  return result;
};

// * Function for get anydata and return data with paging
// *  match : "Search body , $match format"
// *  pageInput : "Page from request require string"
// *  limitInput : "Limit from request require string"
// *  field : "Field name for count and sort from collection ex customerId",
// *  keyName : name of key for result
// *  Model : "Model for get from collection"

// *  population this is reciepe an object be like folling
// **  {
// **     model: < the model of destination collection be want to populate} >,
// **     path: < the path of value be want to poplate > ,
// **     populate < the field as array field this want to populate 2nd levels >
// **  }

// *  res : "Respond"
const getDataWithPaging = async (
  match: any,
  pageInput: any,
  limitInput: any,
  field: any,
  Model: any,
  keyName: string,
  population: any,
  res: Response
) => {
  try {
    logger.debug(`Access into function: getDataWithPaging`);
    const page = pageInput !== "0" ? Number(pageInput) : 1;
    const limitNumber = Number(limitInput);

    let toFacet: any = {};

    const skip = { $skip: page * limitNumber - limitNumber };
    const limit = { $limit: limitNumber || 10 };
    const count = { $count: "total" };
    const sort = { $sort: { [field]: 1 } };
    toFacet._metadata = [];
    toFacet.data = [];
    toFacet._metadata.push(match, count);
    toFacet.data.push(sort, match, skip, limit);

    let toSearchBody = { $facet: toFacet };

    let createFilter: any = JSON.stringify(
      toSearchBody,
      replaceUndefinedOrNull
    );
    createFilter = JSON.parse(createFilter);

    const find = await Model.aggregate([createFilter]);

    // * if want to populate
    if (population) {
      let { data } = find[0];
      let { model, path, populate } = population;
      for (let e of data) {
        await model.populate(e, {
          path: path,
          populate: populate,
        });
      }
    }

    if (find[0].data.length === 0) {
      return res.status(200).respond(0, "Not Found", noDataReturn(keyName));
    }

    const total = find[0]._metadata[0].total;
    const pages = Math.ceil(total / limitNumber);

    let result = {
      _metadata: {
        total: total,
        page: page,
        pages: pages,
      },
      [keyName]: find[0].data,
    };

    // logger.info(`Function getDataWithPaging Done`);
    return result;
  } catch (error) {
    return res.status(500).respond(500, "Error", error);
  }
};

// * loggerStart and loggerStop use on start and stop any function
// * for logging route who call and show totoalTime
// * "name" meaning function name
// * type r = Route , f = Function
const loggerStart = (name: string, type: string, req: any) => {
  if (type === "r") {
    if (!req) {
      return;
    }
    console.time(`Totaltime ${name} ${req.originalUrl}`);
    logger.info(`Running on ${req.headers.host}${req.originalUrl}`);
  } else {
    console.time(`Totaltime ${name}`);
  }

  logger.debug(`Access into function: ${name}`);

  if (!req || !req.params || !req.params.id || type === "r") {
    return;
  }

  logger.silly(`Params => ${req.params.id}`);
};

const loggerStop = (name: string, type: string, req: any) => {
  logger.debug(`Function: ${name} Done`);

  if (type === "r") {
    logger.info(`Finished running on ${req.headers.host}${req.originalUrl}`);
    console.timeEnd(`Totaltime ${name} ${req.originalUrl}`);
  } else {
    console.timeEnd(`Totaltime ${name}`);
  }
};

const loggerError = (error: any) => {
  logger.error(error);
  console.log(error);
};

export default {
  replaceUndefinedOrNull,
  findNextId,
  noDataReturn,
  getDataWithPaging,
  loggerStart,
  loggerStop,
  loggerError,
};
