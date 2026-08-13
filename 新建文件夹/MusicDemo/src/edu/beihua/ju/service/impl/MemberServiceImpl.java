package edu.beihua.ju.service.impl;

import edu.beihua.ju.dao.MemberDao;
import edu.beihua.ju.dao.impl.MemberDaoImpl;
import edu.beihua.ju.entity.Member;
import edu.beihua.ju.entity.PlayList;

public class MemberServiceImpl implements MemberDao {
    MemberDaoImpl mdi = new MemberDaoImpl();

    @Override
    public boolean addMember(Member member) {
        if (mdi.queryByName(member.getUsername()) != null) {
            return false;
        }
        return mdi.addMember(member);
    }

    @Override
    public boolean updateMember(Member member) {
        if (mdi.queryByName(member.getUsername()) == null) {
            return false;
        }
        return mdi.updateMember(member);

    }

    @Override
    public boolean deleteMember(Member member) {

        if (mdi.queryByName(member.getUsername()) == null)
            return false;
        return mdi.deleteMember(member);
    }

    @Override
    public Member queryByName(String name) throws Exception {
        Member member = mdi.queryByName(name);

        if (member == null) {
            throw new Exception("用户名不存在");
        } else
            System.out.println(member.getUsername()+member.getPassword()+member.getGrade());
            return member;
    }
}
