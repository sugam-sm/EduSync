import {
  AtSign, Mail, Phone, VenusAndMars, UserRound, GraduationCap,
  School, HeartHandshake, Link, BookOpen, Contact, X
} from "lucide-react";
import { type User } from '../../features/organization/userSlice';
import { Portal } from "../Portal";

interface UserDetailCardProps {
  user: User;
  onClose: () => void;
}

export const UserDetailCard = ({ user, onClose }: UserDetailCardProps) => {
  const isTeacher = user.role_name?.toLowerCase() === 'teacher';
  const isAdmin = user.role_name?.toLowerCase() === 'admin';
  const teacherData = user.teacher_profile;
  const studentData = user.student_profile;
  const isActive = user.is_active === true;

  const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | undefined | null }) => (
    <div className="flex items-center gap-2 p-2 sm:p-4 bg-light/5 rounded-2xl border border-light/5">
      <div className={`${isAdmin ? 'text-warning' : isTeacher ? 'text-info' : 'text-primary'}`}>
        <Icon size={30} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-text-body tracking-widest">{label}</p>
        <p className="font-semibold text-text-heading text-[15px]">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg bg-surface/50 border-2 border-light/10 rounded-4xl p-3 shadow-2xl shadow-primary/5 overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex justify-between items-start p-2">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-bold text-text-heading capitalize">
                {user.fullname || `${user.first_name} ${user.last_name}`}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-sm font-bold uppercase tracking-wider border-2 ${isAdmin ? 'bg-warning/10 text-warning border-warning/40' : isTeacher ? 'bg-info/10 text-info border-info/40' : 'bg-primary/10 text-primary border-primary/40'
                  }`}>
                  {user.role_name}
                </span>
                <span className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-sm h-full font-bold uppercase border-2 ${isActive ? 'bg-success/10 text-success border-success/40' : 'bg-failure/10 text-failure border-failure/40'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
                  </span>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-failure/20 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-90 cursor-pointer duration-300"
            >
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          {/* Body */}
          <div className="grid grid-cols-2 gap-3 p-3">
            <div className="col-span-2">
              <DetailRow icon={UserRound} label="Full Name" value={user.fullname || `${user.first_name} ${user.last_name}`} />
            </div>
            <div className="col-span-2">
              <DetailRow icon={AtSign} label="Username" value={user.username} />
            </div>
            <div className="col-span-2">
              <DetailRow icon={Mail} label="Email Address" value={user.email} />
            </div>
            <div className="col-span-2">
              <DetailRow icon={VenusAndMars} label="Gender" value={user.gender} />
            </div>

            {isTeacher ? (
              <>
                <div className="col-span-2">
                  <DetailRow icon={Phone} label="Contact Number" value={teacherData?.contact_number} />
                </div>
                <div className="col-span-2">
                  <DetailRow icon={BookOpen} label="Specialization" value={teacherData?.specialization} />
                </div>
                <div className="col-span-2">
                  <DetailRow icon={GraduationCap} label="Qualification" value={teacherData?.qualification} />
                </div>
              </>
            ) : isAdmin ? null : (
              <>
                <div className="col-span-2">
                  <DetailRow icon={School} label="Grade" value={studentData?.grade ? `${studentData.grade_name} - ${studentData.section}` : "N/A"} />
                </div>
                <div className="col-span-2">
                  <DetailRow icon={HeartHandshake} label="Guardian Name" value={studentData?.guardian_name} />
                </div>
                <DetailRow icon={Link} label="Relation" value={studentData?.guardian_relation} />
                <DetailRow icon={Contact} label="Contact" value={studentData?.guardian_contact} />
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};