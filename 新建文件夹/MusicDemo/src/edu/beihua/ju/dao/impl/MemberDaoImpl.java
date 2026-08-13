package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.MemberDao;
import edu.beihua.ju.entity.Member;
import edu.beihua.ju.entity.PlayList;

public class MemberDaoImpl implements MemberDao {

    Member mb[] = new Member[2];

    public MemberDaoImpl() {
        mb[0] = new Member("张三", "123456", 2);
        mb[1] = new Member("李四", "123456", 1);
    }

    @Override
    public boolean addMember(Member member) {
        return false;
    }

    @Override
    public boolean updateMember(Member member) {
        return false;
    }

    @Override
    public boolean deleteMember(Member member) {
        return false;
    }

    @Override
    public Member queryByName(String name) {
        for (Member mb2 : mb)
            if (mb2.getUsername().equals(name)) {
                return mb2;
            }
        return null;
    }
}
