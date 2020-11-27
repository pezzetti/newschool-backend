import { getCoursesByFinished } from '../../DashboardModule/interfaces/getCoursesByFinished';
import { OrderEnum } from '../../CommonsModule/enum/order.enum';
import { EntityRepository, IsNull, Not, Repository } from 'typeorm';
import { CourseTakenStatusEnum } from '../enum/enum';
import { User } from '../../UserModule/entity/user.entity';
import { CourseTaken } from '../entity/course.taken.entity';
import { CertificateDTO } from '../dto/certificate.dto';
import { MoreThanOrEqual } from 'typeorm/index';

@EntityRepository(CourseTaken)
export class CourseTakenRepository extends Repository<CourseTaken> {
  public async findByUserId(
    userId: string,
  ): Promise<CourseTaken[] | undefined> {
    return this.find({
      where: { user: { id: userId } },
    });
  }

  public async getCompletedByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<CourseTaken> {
    return this.findOne(
      {
        user: { id: userId },
        courseId,
        completion: 100,
        status: CourseTakenStatusEnum.COMPLETED,
      },
      {
        relations: ['user'],
      },
    );
  }

  public async findByUser(
    user: CourseTaken['user'],
  ): Promise<CourseTaken[] | undefined> {
    return this.find({ relations: ['user'], where: { user } });
  }

  public async getActiveUsersQuantity(): Promise<number> {
    // eslint-disable-next-line camelcase
    const activeUsers: { user_id: number }[] = await this.createQueryBuilder(
      'coursetaken',
    )
      .where('coursetaken.completion', MoreThanOrEqual<number>(30))
      .select('DISTINCT coursetaken.user', 'user')
      .orderBy('user')
      .getRawMany();
    return activeUsers.length;
  }

  public async getCertificateQuantity(): Promise<number> {
    return this.count({ where: { status: CourseTakenStatusEnum.COMPLETED } });
  }

  // public async findByUserAndCourseWithAllRelations(
  //   user: CourseTaken['user'],
  //   course: CourseTaken['course'],
  // ): Promise<CourseTaken> {
  //   return this.findOne(
  //     { user, course },
  //     {
  //       relations: [
  //         'user',
  //       ],
  //     },
  //   );
  // }

  public async findByUserIdAndCourseIdWithAllRelations(
    userId: string,
    courseId: string,
  ): Promise<CourseTaken> {
    return this.findOne(
      { user: { id: userId }, courseId },
      {
        relations: [
          'user',
        ],
      },
    );
  }

  // public async findCertificateByUserAndCourse(
  //   user: CourseTaken['user'],
  //   course: CourseTaken['course'],
  // ): Promise<CourseTaken> {
  //   return this.findOne(
  //     { user, course, status: CourseTakenStatusEnum.COMPLETED },
  //     { relations: ['user'] },
  //   );
  // }

  public async findCertificateByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<CourseTaken> {
    return this.findOne(
      { user: { id: userId }, courseId, status: CourseTakenStatusEnum.COMPLETED },
      { relations: ['user'] },
    );
  }

  public async findCertificatesByUserId(
    user: User['id'],
  ): Promise<CourseTaken[]> {
    return this.find({
      relations: ['user'],
      where: { user: user, status: CourseTakenStatusEnum.COMPLETED },
    });
  }

  public async findByCourseId(
    courseId: string,
  ): Promise<CourseTaken[] | undefined> {
    return this.find({ courseId });
  }

  public async findByUserIdAndCourseId(
    userId: string,
    courseId: string | number,
  ): Promise<CourseTaken | undefined> {
    const response = await this.find({
      where: { user: { id: userId }, courseId },
      take: 1,
      relations: ['user'],
    });
    return response[0];
  }

  public async getUsersWithTakenCourses(): Promise<number> {
    // TODO: ci version of mysql has "only_full_group_by", check how to disable it to make this query better
    const entities: any[] = await this.createQueryBuilder('coursetaken')
      .where('coursetaken.status = :courseTakenStatus', {
        courseTakenStatus: CourseTakenStatusEnum.TAKEN,
      })
      .select('DISTINCT coursetaken.user', 'user')
      .orderBy('user')
      .getRawMany();
    return entities.length;
  }

  public async getUsersWithCompletedCourses(): Promise<number> {
    // TODO: ci version of mysql has "only_full_group_by", check how to disable it to make this query better
    const entities: any[] = await this.createQueryBuilder('coursetaken')
      .where('coursetaken.status = :courseTakenStatus', {
        courseTakenStatus: CourseTakenStatusEnum.COMPLETED,
      })
      .select('DISTINCT coursetaken.user', 'user')
      .orderBy('user')
      .getRawMany();
    return entities.length;
  }

  public async getUsersWithCompletedAndTakenCourses(): Promise<number> {
    // TODO: ci version of mysql has "only_full_group_by", check how to disable it to make this query better
    // TODO: Typeorm Bug, getCount query is wrong, check https://github.com/typeorm/typeorm/issues/6522
    const entities: any[] = await this.createQueryBuilder('coursetaken')
      .select('DISTINCT coursetaken.user', 'user')
      .orderBy('user')
      .getRawMany();
    return entities.length;
  }

  public async getDistinctCourses(
    order: OrderEnum,
    limit: number,
  ): Promise<getCoursesByFinished> {
    return this.query(
      `SELECT COUNT(*) AS 'frequency', c.title FROM course_taken LEFT JOIN course c ON course_taken.course_id = c.id GROUP BY course_id ORDER BY course_id ${order} LIMIT ${limit}`,
    );
  }

  async findCompletedByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<CourseTaken | undefined> {
    const response = await this.find({
      where: {
        user: { id: userId },
        course: { id: courseId },
        status: CourseTakenStatusEnum.COMPLETED,
        completion: 100,
      },
      take: 1,
      relations: ['user', 'course'],
    });
    return response[0];
  }

  async findCompletedWithRatingByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<CourseTaken | undefined> {
    const response = await this.find({
      where: {
        user: { id: userId },
        courseId,
        status: CourseTakenStatusEnum.COMPLETED,
        completion: 100,
        rating: Not(IsNull()),
      },
      take: 1,
      relations: ['user'],
    });
    return response[0];
  }
}
