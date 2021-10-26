import { DataTypes, Model } from 'sequelize'
import { Optional } from 'sequelize/types'
import { AuthFailed, BaseAttrs, config, Failed, generatePassword, ModelCommonConfig, NotFound, verifyPassword } from '@ysslin/alioth'
import sequelize from '../lib/db'
import { IdentityType } from '../lib/type'

export interface UserAttrs extends BaseAttrs {
  id: number
  username: string
  nickname?: string
  avatar?: string
  email?: string
}

export interface UserIdentityAttrs extends BaseAttrs {
  id: number
  user_id: number
  identity_type: string
  identifier: string
  credential: string
}

export type UserCreationAttrs = Optional<UserAttrs, 'id'>
export type UserIdentityCreationAttrs = Optional<UserIdentityAttrs, 'id'>

class UserIdentity extends Model<UserIdentityAttrs, UserIdentityCreationAttrs> implements UserIdentityAttrs {
  id!: number
  user_id!: number
  identity_type!: string
  identifier!: string
  credential!: string
  create_time?: Date | undefined
  update_time?: Date | undefined
  delete_time?: Date | undefined

  checkPassword(password: string) {
    if (!this.credential) {
      return false
    }
    return verifyPassword(password, this.credential)
  }

  static async verify(username: string, password: string) {
    const user = await this.findOne({
      where: {
        identity_type: IdentityType.Password,
        identifier: username
      }
    })
    if (!user || !user.checkPassword(password)) {
      throw new AuthFailed({
        code: 10031
      })
    }
    return user
  }

  static async changePassword(currentUser: User, oldPassword: string, newPassword: string) {
    const user = await this.findOne({
      where: {
        identity_type: IdentityType.Password,
        identifier: currentUser.username
      }
    })
    if (!user) {
      throw new NotFound({
        code: 10021
      })
    }
    if (!user.checkPassword(oldPassword)) {
      throw new Failed({
        code: 10011
      })
    }
    user.credential = generatePassword(newPassword)
    await user.save()
  }

  static async resetPassword(user: User, newPassword: string) {
    const userIdentity = await this.findOne({
      where: {
        user_id: user.id,
      }
    })
    if (!userIdentity) {
      throw new NotFound({
        code: 10021
      })
    }
    userIdentity.credential = generatePassword(newPassword)
    await userIdentity.save()
  }

}

UserIdentity.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户id'
  },
  identity_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '登录类型（手机号 邮箱 用户名）或第三方应用名称（微信 微博等）'
  },
  identifier: {
    type: DataTypes.STRING(100),
    comment: '标识（手机号 邮箱 用户名或第三方应用的唯一标识）'
  },
  credential: {
    type: DataTypes.STRING,
    comment: '密码凭证（站内的保存密码，站外的不保存或保存token）'
  },
}, {
  sequelize,
  tableName: 'lin_user_identity',
  modelName: 'user_identity',
  ...ModelCommonConfig.options
})

class User extends Model<UserAttrs, UserCreationAttrs> implements UserAttrs {
  id!: number
  username!: string
  nickname?: string | undefined
  avatar?: string | undefined
  email?: string | undefined
  create_time?: Date | undefined
  update_time?: Date | undefined
  delete_time?: Date | undefined

  toJSON() {
    const target = {
      id: this.id,
      username: this.username,
      nickname: this.nickname,
      email: this.email,
      avatar: this.avatar ? `${config.getItem('siteDomain', 'http://localhost')}/assets/${this.avatar}` : ''
    }
    return target
  }
  
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(24),
    allowNull: false,
    comment: '用户名，唯一',
  },
  nickname: {
    type: DataTypes.STRING(24),
    comment: '用户昵称'
  },
  avatar: {
    type: DataTypes.STRING(500),
    comment: '头像url'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
}, {
  sequelize,
  tableName: 'lin_user',
  modelName: 'user',
  ...ModelCommonConfig.options,
  indexes: [
    {
      name: 'username_del',
      unique: true,
      fields: ['username', 'delete_time']
    },
    {
      name: 'email_del',
      unique: true,
      fields: ['email', 'delete_time']
    },
  ],
})

export {
  UserIdentity as UserIdentityModel,
  User as UserModel
}