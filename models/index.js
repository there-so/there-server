import Sequelize from 'sequelize'
import chalk from 'chalk'

// Utilities
import { allEventTypes } from '../helpers/analytics/types'
import { allTypes as allPolicyTypes } from '../helpers/privacy/showLocationPolicy'

const { DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env
const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',

  define: { charset: 'utf8mb4' },
  logging: false,

  pool: {
    max: 100,
    min: 0,
    acquire: 20000,
    idle: 10000,
    handleDisconnects: true,
  },
})

export const connectToDb = async () => {
  try {
    await sequelize.authenticate()
    console.log(
      `${chalk.green(`[DB]`)} Connection has been established successfully.`,
    )
  } catch (error) {
    console.error(
      `${chalk.redBright(`[DB]`)} Unable to connect to the database:`,
      error,
    )
  }
}

// MODELS
const types = {
  UuidAsId: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  Email: {
    type: Sequelize.STRING(191),
  },
}

export const User = sequelize.define(
  'user',
  {
    id: types.UuidAsId,
    twitterId: { type: Sequelize.STRING(191), unique: true },

    // User Settings
    displayFormat: {
      type: Sequelize.ENUM('12h', '24h'),
      defaultValue: '12h',
    },
    showLocationPolicy: {
      type: Sequelize.ENUM(allPolicyTypes),
      defaultValue: 'always',
    },

    // Person
    email: types.Email,
    firstName: Sequelize.STRING(191),
    lastName: Sequelize.STRING(191),
    fullName: Sequelize.STRING(191),
    twitterHandle: Sequelize.STRING(191),
    photoUrl: Sequelize.TEXT,
    photoCloudObject: Sequelize.TEXT,

    // Timezone
    city: Sequelize.STRING(191),
    fullLocation: Sequelize.TEXT,
    timezone: Sequelize.STRING(191),

    // Permission
    isAdmin: Sequelize.BOOLEAN,

    // Type
    isAnonymous: Sequelize.BOOLEAN,
  },
  { charset: 'utf8mb4' },
)

export const ManualPerson = sequelize.define(
  'manualPerson',
  {
    id: types.UuidAsId,

    firstName: Sequelize.STRING(191),
    lastName: Sequelize.STRING(191),
    twitterHandle: Sequelize.STRING(191),
    photoUrl: Sequelize.TEXT,
    photoCloudObject: Sequelize.TEXT,

    city: Sequelize.TEXT,
    fullLocation: Sequelize.TEXT,
    timezone: Sequelize.STRING(191),

    pinned: Sequelize.BOOLEAN,
    pinnedAt: Sequelize.DATE,
  },
  { charset: 'utf8mb4' },
)

export const ManualPlace = sequelize.define(
  'manualPlace',
  {
    id: types.UuidAsId,

    name: Sequelize.STRING(191),
    photoUrl: Sequelize.TEXT,
    photoCloudObject: Sequelize.TEXT,

    city: Sequelize.TEXT,
    fullLocation: Sequelize.TEXT,
    timezone: Sequelize.STRING(191),

    pinned: Sequelize.BOOLEAN,
    pinnedAt: Sequelize.DATE,
  },
  { charset: 'utf8mb4' },
)

export const FollowingsOrder = sequelize.define(
  'followingsOrder',
  {
    id: types.UuidAsId,
    peopleIds: Sequelize.TEXT,
    placesIds: Sequelize.TEXT,
  },
  { charset: 'utf8mb4' },
)

export const AnalyticsEvent = sequelize.define(
  'analyticsEvent',
  {
    id: types.UuidAsId,
    type: Sequelize.ENUM(allEventTypes),
    machineId: Sequelize.TEXT,
    appVersion: Sequelize.STRING,
    os: Sequelize.STRING,
    osVersion: Sequelize.TEXT,
  },
  { charset: 'utf8mb4' },
)

// export const Timezone = sequelize.define(
//   'timezone',
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     country: Sequelize.STRING,
//     name: Sequelize.STRING,
//     lat: Sequelize.STRING,
//     lng: Sequelize.STRING,
//     countryName: Sequelize.STRING,
//     regionName: Sequelize.STRING,
//     abbreviation: Sequelize.STRING,
//     updatedAt: Sequelize.STRING,
//     skipped: Sequelize.BOOLEAN,
//   },
//   { charset: 'utf8mb4' },
// )

// Set associations
User.belongsToMany(User, { as: 'following', through: 'userFollowings' })
User.belongsToMany(User, { as: 'pinnedUsers', through: 'userPinneds' })
User.hasMany(ManualPerson)
User.hasMany(ManualPlace)
User.hasOne(FollowingsOrder)
User.hasMany(AnalyticsEvent)

// Create tables if they are not there
sequelize.sync()
