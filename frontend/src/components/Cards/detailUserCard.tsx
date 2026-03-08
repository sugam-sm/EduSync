import { 
  AtSign, Mail, Phone, VenusAndMars, UserRound, GraduationCap, 
  School, HeartHandshake, Link, BookOpen, Contact, X
} from "lucide-react";
import { type User } from '../../features/management/userSlice';
import { Portal } from "../Portal";

interface UserDetailCardProps {
  user: User;
  onClose: () => void;
}

export const UserDetailCard = ({ user, onClose }: UserDetailCardProps) => {
  const isTeacher = user.role_name?.toLowerCase() === 'teacher';
  const teacherData = user.teacher_profile;
  const studentData = user.student_profile;

  const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | undefined | null }) => (
    <div className="flex items-start gap-3 p-3 bg-light/5 rounded-lg border border-light/10">
      <div className={`mt-0.5 ${isTeacher ? 'text-info' : 'text-primary'}`}>
        <Icon size={18} strokeWidth={3}/>
      </div>
      <div>
        <p className={`text-[12px] uppercase font-bold ${isTeacher ? 'text-info' : 'text-primary'} tracking-wider`}>{label}</p>
        <p className="font-semibold text-text-heading">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-light/10">
        <div className="w-full max-w-lg  rounded-2xl p-6">
          <div className="flex justify-between items-center rounded-xl mb-6 p-4 border-2 border-light/20">
            <div className="flex items-center gap-3">
              <span className={`${isTeacher ? 'text-info' : 'text-primary'} font-bold text-lg capitalize`}>{user.role_name} Profile</span>
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.is_active ? 'bg-success/10 text-success' : 'bg-failure/10 text-failure'}`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1.5 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-180 cursor-pointer"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <DetailRow icon={UserRound} label="Full Name" value={user.fullname || `${user.first_name} ${user.last_name}`} />
            <DetailRow icon={AtSign} label="Username" value={user.username} />
            <DetailRow icon={Mail} label="Email Address" value={user.email} />
            <DetailRow icon={VenusAndMars} label="Gender" value={user.gender} />

            {isTeacher ? (
              <>
                <DetailRow icon={Phone} label="Contact Number" value={teacherData?.contact_number} />
                <DetailRow icon={BookOpen} label="Specialization" value={teacherData?.specialization} />
                <DetailRow icon={GraduationCap} label="Qualification" value={teacherData?.qualification} />
              </>
            ) : (
              <>
                <DetailRow icon={School} label="Grade" value={studentData?.grade ? `${studentData.name} - ${studentData.section}` : "N/A"} />
                <DetailRow icon={HeartHandshake} label="Guardian Name" value={studentData?.guardian_name} />
                <DetailRow icon={Link} label="Guardian Relation" value={studentData?.guardian_relation} />
                <DetailRow icon={Contact} label="Guardian Contact" value={studentData?.guardian_contact} />
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};