import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertDianTestSetDto {
  @IsString()
  @IsNotEmpty()
  dianTestSetId!: string;
}

