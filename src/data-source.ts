import { DataSource } from 'typeorm';
import * as config from 'config';

const dbConfig = config.get('db');

export const AppDataSource: DataSource = new DataSource({
  type: process.env.DB_TYPE || dbConfig.type,
  host: process.env.POSTGRES_HOST || dbConfig.host,
  port: +process.env.POSTGRES_PORT || 5432,
  username: process.env.DB_USERNAME || dbConfig.username,
  password: process.env.DB_PASSWORD || dbConfig.password,
  database: process.env.POSTGRES_DB || dbConfig.database,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrationsRun: false,
  logging: true,
  migrationsTableName: 'migration',
  migrations: [
    __dirname + '/migration/**/*.ts',
    __dirname + '/migration/**/*.js',
  ],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
