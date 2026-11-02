import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IssuerType } from '@prisma/client';

export type Role =
  | 'DOCTOR'
  | 'CLINIC'
  | 'COLLABORATOR'
  | 'PATIENT'
  | 'ADMIN'
  | 'SYSTEM'
  | 'MEMBER';

@Injectable()
export class IssuerService {
  resolveIssuer(role: Role | undefined, subjectId: string | undefined) {
    if (!role || !subjectId) {
      throw new UnauthorizedException('Missing auth context');
    }
    if (role === 'DOCTOR' || role === 'COLLABORATOR') {
      return { issuerType: IssuerType.DOCTOR, issuerId: subjectId };
    }
    if (role === 'CLINIC') {
      return { issuerType: IssuerType.CLINIC, issuerId: subjectId };
    }
    throw new UnauthorizedException('Role not allowed');
  }
}
