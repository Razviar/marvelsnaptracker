using DataGetter;
using System;

namespace DataGetter
{
    public class ServerInterface : MarshalByRefObject
    {
        public PipeClient PipeClient = new PipeClient();
        public static void Log(string message)
        {
            Console.WriteLine(message);
        }

        public void ReportMessages(string[] messages)
        {
            for (int index = 0; index < messages.Length; ++index)
                Log(messages[index]);
        }

        public void ReportPacket(string packet)
        {
            try
            {
                PipeClient.SendMessage(packet);
            }
            catch (Exception ex)
            {
                Log("Error: " + ex.ToString());
            }
        }

        public void ReportMessage(string message) => Log(message);

        public void Ping()
        {
            //PipeClient.SendMessage("ping");
        }
    }
}
