import { Injectable } from '@nestjs/common'
import { hash } from 'argon2'
import { startOfDay, subDays } from 'date-fns'
import { AuthDto } from 'src/auth/dto/auth.dto'
import { PrismaService } from 'src/prisma.service'
import { UserDto } from './dto/user.dto'
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService){}

  async getById(id: string){
    return this.prisma.user.findUnique({
      where: {
        id
      },
      include: {
        tasks: true
      }
    })
  }
  async getByEmail(email: string){
    return this.prisma.user.findUnique({
      where: {
        email
      }
    })
  }
  async create(dto: AuthDto){
    const user = {
      email: dto.email,
      name: '',
      password: await hash(dto.password),
    }
    return this.prisma.user.create({
      data: user,
    })
  }
  async getProfile(id: string){
    const profile = await this.getById(id)
    const totalTask = profile.tasks.length
    const completedTasks = await this.prisma.task.count({
      where: {
        userId: id,
        isCompleted: true
      }
    })
    const todayStart = startOfDay(new Date())
    const weekStart = startOfDay(subDays(new Date(), 7))

    const todayTasks = await this.prisma.task.count({
      where: {
        userId: id,
        createAt: {
          gte: todayStart.toISOString()
        }
      }
    })
    const weekTasks = await this.prisma.task.count({
      where: {
        userId: id,
        createAt: {
          gte: weekStart.toISOString()
        }
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password, ...rest} = profile
    return{
      user: rest,
      statistics:[
        {label: 'Всего', value: totalTask},
        {label: 'Выполнено задач', value: completedTasks},
        {label: 'Задачи сегодня', value: todayTasks},
        {label: 'Недельные задачи', value: weekTasks},
      ]
    }
  }
  async update(id: string, dto: UserDto){
    let data = dto;

    if(dto.password){
      data = {...dto, password: await hash(dto.password)}
    }

    return this.prisma.user.update({
      where:{
        id,
      },
      data,
      select:{
        name: true,
        email: true,
        breakInterval: true,
      }
    })
  }
}
