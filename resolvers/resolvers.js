// Queries
import followingList from './followingList'
import placesAutoComplete from './placesAutoComplete'
import updateLocationAndTimezone from './updateLocationAndTimezone'
import allUsersByName from './allUsersByName'

// Mutations
import followUser from './followUser'
import updateUser from './updateUser'
import addManualPlace from './addManualPlace'
import addManualPerson from './addManualPerson'

const resolvers = {
  Query: {
    title: () => 'There PM!',
    userId: async (obj, args, ctx) => ctx.userId,
    user: (obj, args, ctx) => ctx.user.get(),
    followingList,
    placesAutoComplete,
    allUsersByName,
  },

  Mutation: {
    updateUser,
    followUser,
    updateLocationAndTimezone,
    addManualPlace,
    addManualPerson,
  },

  // TYPES
  User: {
    __isTypeOf: ({ __resolveType }) =>
      __resolveType ? __resolveType === 'User' : true,
  },
  ManualPerson: {
    __isTypeOf: ({ __resolveType }) =>
      __resolveType ? __resolveType === 'ManualPerson' : true,
  },
  ManualPlace: {
    __isTypeOf: ({ __resolveType }) =>
      __resolveType ? __resolveType === 'ManualPlace' : true,
  },
}

export default resolvers
