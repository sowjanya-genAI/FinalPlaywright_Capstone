import { testInfo } from '@playwright/test';

export class Logger {
static info(message:string)
{
    console.log(`ℹ️ [INFO] ${message}`);
   const timestamp=new Date().toISOString();
   const logline=`[INFO] ${timestamp} - ${message}\n`;
   console.log(logline);

   testInfo().attach(`Log :${message}`,{contentType:'text/plain',body:logline});

}

static error(message:string,error?:Error)
{
    const timestamp=new Date().toISOString();
    const logline=`[ERROR] ${timestamp} : ${message}\n`;
    console.error(logline); 
}
}
