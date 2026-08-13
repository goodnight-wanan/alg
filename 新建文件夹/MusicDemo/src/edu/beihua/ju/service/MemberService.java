package edu.beihua.ju.service;

import edu.beihua.ju.entity.Member;
import edu.beihua.ju.entity.PlayList;

public interface MemberService {
    boolean addMember (Member member);
    boolean updateMember(String name);
    boolean deleteMember(Member member);

    PlayList queryByName(String name) throws Exception;
}
