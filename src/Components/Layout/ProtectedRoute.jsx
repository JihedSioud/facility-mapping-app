import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const ROLE_PRIORITY = {
  visitor: 0,
  editor: 1,
  admin: 2,
};

export default function ProtectedRoute({ children, minRole = "editor" }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-500">
        Checking permissions…
      </div>
    );
  }

  if (ROLE_PRIORITY[role] < ROLE_PRIORITY[minRole]) {
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  minRole: PropTypes.oneOf(["visitor", "editor", "admin"]),
};
