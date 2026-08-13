package edu.beihua.ju.dao;

import edu.beihua.ju.entity.Member;
import edu.beihua.ju.entity.PlayList;

public interface MemberDao {
    boolean addMember (Member member);
    boolean updateMember(Member member);
    boolean deleteMember(Member member);

    Member queryByName(String name) throws Exception;
}
