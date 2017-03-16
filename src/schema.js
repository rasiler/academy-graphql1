import * as _ from 'underscore';

import PostsList from './data/posts';
import UsersMap from './data/users';
import CommentsList from './data/comments';

import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLInterfaceType
} from 'graphql';


const GeoCoord = new GraphQLObjectType({
  name: 'GeoCoord',
  description: 'The address for a user',
  fields: () => ({
    lat: {type: GraphQLString},
    lng: {type: GraphQLString}
  })
});

const Address = new GraphQLObjectType({
  name: 'Address',
  description: 'The address for a user',
  fields: () => ({
    street: {type: GraphQLString},
    suite: {type: GraphQLString},
    city: {type: GraphQLString},
    zipcode: {type: GraphQLString},
    geo: {type: GeoCoord},
  })
});

const Company = new GraphQLObjectType({
  name: 'Company',
  description: 'The company for a user',
  fields: () => ({
    name: {type: GraphQLString},
    catchPhrase: {type: GraphQLString},
    bs: {type: GraphQLString}
  })
});

const User = new GraphQLObjectType({
  name: 'User',
  description: 'Respresents an user on the blog site',
   fields: () => ({
    id: {type: GraphQLInt},
    name: {type: GraphQLString},
    username: {type: GraphQLString},
    email: {type: GraphQLString},
    address: {type: Address},
    phone: {type: GraphQLString},
    website: {type: GraphQLString},
    company: {type: Company}
  })
});



const Category = new GraphQLEnumType({
  name: 'Category',
  description: 'A Category of the blog',
  values: {
    METEOR: {value: 'meteor'},
    PRODUCT: {value: 'product'},
    USER_STORY: {value: 'user-story'},
    OTHER: {value: 'other'}
  }
});

const HasAuthor = new GraphQLInterfaceType({
  name: 'HasAuthor',
  description: 'This type has an author',
  fields: () => ({
    author: {type: User}
  }),
  resolveType: (obj) => {
    if(obj.title) {
      return Post;
    } else if(obj.replies) {
      return Comment;
    } else {
      return null;
    }
  }
});

const Comment = new GraphQLObjectType({
  name: 'Comment',
  description: 'Represent a comment made about a post',
  fields: () => ({
    id: {type: GraphQLInt},
    postId: {type: GraphQLInt},
    name: {type: GraphQLString},
    email: {type: GraphQLString},
    body: {type: GraphQLString},
  })
});

const Post = new GraphQLObjectType({
  name: 'Post',
  interfaces: [HasAuthor],
  description: 'Represent the type of a blog post',
  fields: () => ({
    id: {type: GraphQLInt},
    userId: {type: GraphQLInt},
    title: {type: GraphQLString},
    category: {type: Category},
    likeCount: {type: GraphQLInt},
    body: {type: GraphQLString},
    timestamp: {
      type: GraphQLFloat,
      resolve: function(post) {
        if(post.date) {
          return new Date(post.date.getTime());
        } else {
          return null;
        }
      }
    },
    comments: {
      type: new GraphQLList(Comment),
      args: {
        limit: {type: GraphQLInt, description: 'Limit the comments returing'}
      },
      resolve: function(post, {limit}) {
        let cList = _.filter(CommentsList, (comment) => post.id === comment.postId);
        if(limit >= 0) {
          return cList.slice(0, limit);
        }

        return cList;
      }
    },
    author: {
      type: User,
      resolve: function(post) {
        return _.filter(_.values(UsersMap), user => post.userId === user.id)[0];
      }
    }
  })
});

const Query = new GraphQLObjectType({
  name: 'BlogSchema',
  description: 'Root of the Blog Schema',
  fields: () => ({
    posts: {
      type: new GraphQLList(Post),
      description: 'List of posts in the blog',
      args: {
        category: {type: Category}
      },
      resolve: function(source, {category}) {
        if(category) {
          return _.filter(PostsList, post => post.category === category);
        } else {
          return PostsList;
        }
      }
    },

    users: {
      type: new GraphQLList(User),
      description: 'List of users of the blog site',
      resolve: function(source, {username}) {
          return _.values(UsersMap);
      }
    },


    user: {
      type: User,
      description: 'User by username',
      args: {
        username: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: function(source, {username}) {
        return UsersMap[username.toLowerCase()];
      } 
    },


    latestPost: {
      type: Post,
      description: 'Latest post in the blog',
      resolve: function() {
        PostsList.sort((a, b) => {
          var bTime = new Date(b.date['$date']).getTime();
          var aTime = new Date(a.date['$date']).getTime();

          return bTime - aTime;
        });

        return PostsList[0];
      }
    },

    recentPosts: {
      type: new GraphQLList(Post),
      description: 'Recent posts in the blog',
      args: {
        count: {type: new GraphQLNonNull(GraphQLInt), description: 'Number of recent items'}
      },
      resolve: function(source, {count}) {
        PostsList.sort((a, b) => {
          var bTime = new Date(b.date['$date']).getTime();
          var aTime = new Date(a.date['$date']).getTime();

          return bTime - aTime;
        });

        return PostsList.slice(0, count);
      }
    },

    post: {
      type: Post,
      description: 'Post by id',
      args: {
        id: {type: new GraphQLNonNull(GraphQLInt)}
      },
      resolve: function(source, {id}) {
        return _.filter(PostsList, post => post.id === id)[0];
      }
    },
  })
});

const Mutation = new GraphQLObjectType({
  name: 'BlogMutations',
  fields: {
    createPost: {
      type: Post,
      description: 'Create a new blog post',
      args: {
        title: {type: new GraphQLNonNull(GraphQLString)},
        body: {type: new GraphQLNonNull(GraphQLString)},
        category: {type: Category},
        author: {type: new GraphQLNonNull(GraphQLString), description: 'username of the author'}
      },
      resolve: function(source, {...args}) {
        let post = args;

        let user = UsersMap[post.author.toLowerCase()];
        if(!user) {
          throw new Error('No such author: ' + post.author);
        }
        
        post.userId = user.id;
        post.id = _.size(PostsList) + 1;
        post.date = new Date();

        console.log(post);
        PostsList.push(post);
        return post;
      }
    },

    createUser: {
      type: User,
      description: 'Create a new user',
      args: {
        username: {type: new GraphQLNonNull(GraphQLString)},
        name: {type: new GraphQLNonNull(GraphQLString)},
        email: {type: GraphQLString}
      },
      resolve: function(source, {...args}) {
        let user = args;
       
        if(UsersMap[user.username.toLowerCase()]) {
          throw new Error('User already exists: ' + user.username);
        }
        let id = _.size(_.values(UsersMap)) + 1;
        user.id = id;
        UsersMap[user.username.toLowerCase()] = user;
        return user;
      }
    }
  }
});

const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation
});

export default Schema;
