import axios from 'axios';
import constants from './constants';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';

const config = {
  host: constants.BASE_URL,
  apiKey: constants.APPLICATION_KEY,
  secretKey: constants.APP_SECRET_KEY,
};

let apiParams = {
  apiKey: config.apiKey,
  apiVersion: '1.1',
  signatureVersion: '2.0',
  signatureMethod: 'HmacSHA256',
  responseFormat: 'JSON',
};

export async function postApi(action, payload, obj, header) {
  // let timestamp = dayjs().format('YYMMDDHHmmss') + '+05:30';
  let timestamp = dayjs().format('YYMMDDHHmmssZZZZZ');

  let message =
    action +
    `/${constants.APPLICATION_KEY}/` +
    obj?.email +
    '1.1/2.0/HmacSHA256/' +
    timestamp +
    '/JSON';

  let signature = CryptoJS.HmacSHA256(
    message,
    constants.APP_SECRET_KEY + obj?.userkey,
  ).toString(CryptoJS.enc.Base64url);

  let url = `${apiParams.apiKey}/${obj?.email}${apiParams.apiVersion}/${apiParams.signatureVersion}/${apiParams.signatureMethod}/${signature}/${timestamp}/${apiParams.responseFormat}`;

  console.log('PostApi : ', `${constants.BASE_URL}/${action}/${url}`, payload);

  return await axios.post(`${constants.BASE_URL}/${action}/${url}`, payload, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      //Authorization: 'Bearer ' + header.authorization,
    },
  });
}

export async function getApi(action, obj, header) {
  //console.log('obj :: ', obj);

  // obj?.user_key !== null ? obj?.user_key : ''
  // ${obj?.email !== null ? obj?.email : ''}
  console.log('obj : user key --> ', obj?.user_key);
  console.log('obj : user email --> ', obj?.email);

  apiParams.signature = CryptoJS.HmacSHA256(message, config.secretKey).toString(
    CryptoJS.enc.Base64url,
  );

  const url = `${apiParams.apiKey}/${apiParams.apiVersion}/${apiParams.signatureVersion}/${apiParams.signatureMethod}/${apiParams.signature}/${apiParams.timestamp}/${apiParams.responseFormat}`;

  console.log('GetApi : ', `${constants.BASE_URL}/${action}/${url}`);

  return await axios.get(`${constants.BASE_URL}/${action}/${url}`, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      // 'x-access-token': `${header.authorization}`,
      Authorization: 'Bearer' + ' ' + header.authorization,
    },
  });
}
export async function getApiGeneral(url, header) {
  console.log('GetApi: ', `${constants.BASE_URL1}/${url}`);

  return await axios.get(`${constants.BASE_URL1}/${url}`, {
    headers: {
      Accept: header.Accept,
      'Content-type': header.contenttype,
      // 'x-access-token': header.accesstoken,
      Authorization: 'Bearer' + ' ' + header.accesstoken,
    },
  });
}
export async function postApiGeneral(url, payload, header) {
  console.log('PostApi: ', `${constants.BASE_URL1}/${url}`);

  return await axios.post(`${constants.BASE_URL1}/${url}`, payload, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      // 'x-access-token': header.accesstoken
      Authorization: 'Bearer' + ' ' + header.accesstoken,
    },
  });
}
export async function deleteApiGeneral(url, header) {
  console.log('DeleteApi: ', `${constants.BASE_URL1}/${url}`);

  return await axios.delete(`${constants.BASE_URL1}/${url}`, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      // 'x-access-token': header.accesstoken
    },
  });
}

// import axios from 'axios';
// import constants from './constants';
// import CryptoJS from 'crypto-js';
// import dayjs from 'dayjs';

// const config = {
//   host: constants.BASE_URL,
//   apiKey: constants.APPLICATION_KEY,
//   secretKey: constants.APP_SECRET_KEY,
// };

// const apiParams = {
//   apiKey: config.apiKey,
//   apiVersion: '1.1',
//   signatureVersion: '2.0',
//   signatureMethod: 'HmacSHA256',
//   timestamp: dayjs().format('YYMMDDHHmmss') + '+05:30',
//   responseFormat: 'JSON',
// };

// export async function postApi(action, payload, obj, header) {
//   const message =
//     action +
//     `/${config.apiKey}/` +
//     (obj?.email !== '' ? obj?.email + '/' : '') +
//     '1.1/2.0/HmacSHA256/' +
//     apiParams.timestamp +
//     '/JSON';

//   apiParams.signature = CryptoJS.HmacSHA256(
//     message,
//     config.secretKey + (obj?.user_key !== '' ? obj?.user_key : ''),
//   ).toString(CryptoJS.enc.Base64url);

//   const url = `${apiParams.apiKey}/${obj?.email ? obj?.email + '/' : ''}${
//     apiParams.apiVersion
//   }/${apiParams.signatureVersion}/${apiParams.signatureMethod}/${
//     apiParams.signature
//   }/${apiParams.timestamp}/${apiParams.responseFormat}`;

//   console.log('PostApi : ', `${constants.BASE_URL}/${action}/${url}`, payload);

//   return await axios.post(`${constants.BASE_URL}/${action}/${url}`, payload, {
//     headers: {
//       Accept: header.Accept,
//       'Content-Type': header.contenttype,
//       Authorization: 'Bearer ' + header.authorization,
//     },
//   });
// }

// export async function getApi(action, obj, header) {
//   console.log('obj :: ', obj);

//   // obj?.user_key !== null ? obj?.user_key : ''
//   // ${obj?.email !== null ? obj?.email : ''}
//   console.log('obj : user key --> ', obj?.user_key);
//   console.log('obj : user email --> ', obj?.email);

//   apiParams.signature = CryptoJS.HmacSHA256(message, config.secretKey).toString(
//     CryptoJS.enc.Base64url,
//   );

//   const url = `${apiParams.apiKey}/${apiParams.apiVersion}/${apiParams.signatureVersion}/${apiParams.signatureMethod}/${apiParams.signature}/${apiParams.timestamp}/${apiParams.responseFormat}`;

//   console.log('GetApi : ', `${constants.BASE_URL}/${action}/${url}`);

//   return await axios.get(`${constants.BASE_URL}/${action}/${url}`, {
//     headers: {
//       Accept: header.Accept,
//       'Content-Type': header.contenttype,
//       // 'x-access-token': `${header.authorization}`,
//       Authorization: 'Bearer' + ' ' + header.authorization,
//     },
//   });
// }
