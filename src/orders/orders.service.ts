import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderCreateDto } from './dto/order.create.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // * 주문 등록
  async createOrder(customerId: number, body: OrderCreateDto) {
    // * 1. 전달 받은 장바구니들의 유효성 검사를 진행하면서 금액 합산
    let totalPrice: number = 0;
    
    for (const id of body.cartIds) {
      const cart = await this.prisma.cart.findUnique({ where: { id } });
      // ! 해당하는 장바구니가 없는 경우
      if (!cart) {
        throw new HttpException('장바구니를 다시 확인해주세요.', HttpStatus.NOT_FOUND);
      }

      // ! 장바구니 등록 권한이 없는 경우
      if (cart.CustomerId !== customerId) {
        throw new HttpException('등록 권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      // ! 이미 주문 완료한 장바구니인 경우
      if (cart.status === "ordered") {
        throw new HttpException('이미 주문 완료한 장바구니입니다.', HttpStatus.PRECONDITION_FAILED);
      }

      totalPrice += cart.price;
    }

    // * 2. 고객의 잔여 포인트를 확인
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    // ! 잔여 포인트가 주문 금액보다 작은 경우
    if (customer.point < totalPrice) {
      throw new HttpException('보유 포인트가 부족합니다.', HttpStatus.PAYMENT_REQUIRED);
    }

    // * 3. 주문 등록 시 사용할 업장 정보를 가져오기
    const storeId = await this.prisma.menu.findUnique({
      where: { id: body.cartIds[0], },
      select: {
        StoreId: true,
      } 
    });

    // * 4. 주문 등록 (무결성을 위해 트랜잭션 사용)
    await this.prisma.$transaction(async (tx) => {
      // * 4-1 주문을 생성하면서 관계 형셩
      await this.prisma.order.create({ data: {
        CustomerId: customerId,
        StoreId: storeId.StoreId,
        price: totalPrice,
        Carts: {
          connect: body.cartIds.map((id) => ({ id })),
        },
      }});

      // * 4-2 장바구니의 상태를 주문완료로 업데이트
      for (const id of body.cartIds) {
        await this.prisma.cart.update({ where: { id }, data: { status: "ordered" } });
      }
  
      // * 4-3 고객의 포인트를 차감
      await this.prisma.customer.update({ where: { id: customerId }, data: { point: { decrement: totalPrice } } });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return { message: '주문 등록이 완료되었습니다.' };
    }
    
  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: any) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
