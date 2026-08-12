import * as fs from 'fs';
import * as path from 'path';

export class Logger {
    private logFilePath: string;
    private showInConsole: boolean;

    /**
     * Initializes a new Logger instance.
     * @param fileName Name of the file inside the logs directory.
     * @param showInConsole Pass false to turn off console log mirroring.
     */
    constructor(fileName: string = 'api-execution.log', showInConsole: boolean = true) {
        
        const logDirectory = path.resolve(__dirname, '../logs');
        console.log(`logDirectory: ${logDirectory}  path is ${path.join(logDirectory, fileName)}`)
        this.logFilePath = path.join(logDirectory, fileName);
        this.showInConsole = showInConsole;

        // Ensure the logs storage folder exists
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }
    }

    /**
     * Clears or resets the file content back to an empty slate.
     */
    public clear(): void {
        fs.writeFileSync(this.logFilePath, '', { flag: 'w' });
    }

    /**
     * Appends a log line entries payload into the local storage file.
     */
    private append(level: 'INFO' | 'WARN' | 'ERROR'|'DEBUG', message: string): void {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
        const structuredLine = `[${timestamp}] [${level}]: ${message}\n`;

        fs.appendFileSync(this.logFilePath, structuredLine, 'utf-8');

        if (this.showInConsole) {
            console.log(`[${level}]: ${message}`);
        }
    }

    public info(message: string): void {
        this.append('INFO', message);
    }

    public warn(message: string): void {
        this.append('WARN', message);
    }

    public error(message: string): void {
        this.append('ERROR', message);
    }

    public debug(message: string): void {
        if (process.env.DEBUG === 'true') {
           this.append('DEBUG',message)
        }
    }
}