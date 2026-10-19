import React, {useState, useEffect} from 'react';
import {toast} from "react-hot-toast";
import axios from "axios";
import { Link, useParams } from 'react-router-dom';
import Plan from "../../components/admin/Plan";
import { BASE_URL } from '../../utils/fetchData';
import { Loader, Heading } from '../../components';
const Plans = () => {
const [plans, setplans] = useState([]);
const [loading, setLoading] = useState(false);
console.log(plans);

const {pid} = useParams();
console.log(plans);
   //  handle get Plans
   const getAllPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/v1/plan/getall-plan`);

      if (res.data && res.data.success) {
        setplans(res.data.plans || []);
      }
      setLoading(false); 
    }
    catch (err) {
      console.log(err);
      toast.error("Something went wrong in getting plans");
      setLoading(false); 
    }
  }

  useEffect(() => {
    getAllPlans();
  }, []);

  if(loading){
    return <Loader/>
  }

  return (
    <section className='bg-gray-900 pt-10'>
      <Heading name="Plans List"/>
      <div className="container mx-auto px-6 py-10">
        {plans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl mb-6">No gym plans found in the database.</p>
            <Link to="/dashboard/admin/create-plane" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
              Create New Plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
            {plans.map((p, i) => (
              <Plan planName={p.planName} monthlyPlanAmount={p.monthlyPlanAmount} yearlyPlanAmount={p.yearlyPlanAmount} p_id={p._id} key={i}/>
            ))}
          </div>
        )}
      </div>
    </section>
  )

}

export default Plans;