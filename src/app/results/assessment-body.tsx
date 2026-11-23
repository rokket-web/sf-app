import type { DiscView } from "@/lib/assessment/access";
import type { TtiReportSection } from "@/lib/assessment/types";
import { BLUE, PageTitle, ReportPage, headingFont } from "./report-page";
import { compassPoint } from "./compass";
import { CompassGraphic } from "./compass-graphic";
import { ReportSections } from "./report-sections";

// The assessment as a web version of the OXYGEN Profile PDF. Shared by "My results" and "View assessment".
export function AssessmentBody({
  disc,
  sections,
  name,
}: {
  disc: DiscView;
  sections: TtiReportSection[] | null;
  name: string;
}) {
  const date = disc.reportDate ? new Date(disc.reportDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replaceAll("/", ".") : "";

  return (
    <div className="space-y-6">
      {/* Cover */}
      <ReportPage name={name} bare>
        <div className="flex flex-col items-center gap-10 py-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/report/oxygen-logo.png" alt="OXYGEN Profile Assessment" className="w-full max-w-sm" />
          <div className="space-y-1">
            <p className="text-lg tracking-wide text-[#4c4c4c]">REPORT PREPARED FOR:</p>
            <p className="text-lg text-[#4c4c4c]">
              <strong className="uppercase text-[#111]">{name}</strong>
              {date && <span> &nbsp;|&nbsp; {date}</span>}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/report/stronger-families.png" alt="Stronger Families" className="w-44" />
        </div>
      </ReportPage>

      {sections?.length ? (
        <>
          <Welcome name={name} />
          <Compass name={name} natural={compassPoint(disc.wheelPos.natural)} adapted={compassPoint(disc.wheelPos.adapted)} />
          <ReportSections sections={sections} name={name} />
          <Resources name={name} />
        </>
      ) : (
        <ReportPage name={name}>
          <p className="text-sm">
            The written report isn&apos;t available right now. Try &ldquo;Refresh from TTI&rdquo;, or open the PDF above.
          </p>
        </ReportPage>
      )}
    </div>
  );
}

function Welcome({ name }: { name: string }) {
  return (
    <ReportPage name={name}>
      <h2 className={`${headingFont.className} text-3xl font-medium uppercase text-[#4c4c4c]`}>Welcome</h2>
      <div className="space-y-4 text-sm leading-relaxed">
        <p className="font-bold">Congratulations on completing your OXYGEN Profile Assessment!</p>
        <p>
          We hope as you read about your unique style and your partner&apos;s style, you will be encouraged and
          empowered.
        </p>
        <div className="sm:flex sm:items-start sm:gap-6">
          <p className="sm:flex-1">
            No two relationships are the same. No two people are the same. We are here to help you navigate as you seek
            to bring strength and growth to your one of a kind relationship.
          </p>
          <p className={`${headingFont.className} mt-3 border-y py-2 text-xl leading-tight sm:mt-0 sm:w-56`} style={{ color: BLUE, borderColor: BLUE }}>
            Love isn&apos;t something we find. It is something we choose to create.
          </p>
        </div>
        <p>This report is uniquely customized to you.</p>
        <p>
          The OXYGEN Profile assessment is an in-depth look at who you are, how you see the world, and how to best
          relate. Get ready to be inspired by the insights and challenged by the opportunity to seek to understand each
          other on new levels!
        </p>
        <p>As you begin your Oxygen Profile Assessment experience:</p>
        <ul className="space-y-3 pl-6 marker:text-[#00a8e1] [&>li]:list-disc">
          <li>
            If you are attending the OXYGEN Seminar, please print out and bring along your report. You and your partner
            will be discussing the information during the Seminar and using it as a road map.
          </li>
          <li>Prepare for a deep dive into your relationship. Keep an open mind and have some fun!</li>
          <li>
            No assessment can ever exactly map who you are. The OXYGEN Profile assessment is very accurate but will
            never 100% highlight who you are. Take what resonates and run with it. If something doesn&apos;t sound like
            you, no worries. Focus on what does and use it to strengthen your relationship.
          </li>
        </ul>
        <p>
          You are here because your relationship matters. Just taking the OXYGEN Profile assessment shows you care.
          There is always hope. As you put each other first and choose to commit to making your relationship stronger,
          you will grow. It&apos;s an exciting journey, not a sprint.
        </p>
        <p>
          Some of the tools in OXYGEN revolutionized our relationship and 13 years later, we look back with awe at how
          far we have come. If you commit to wanting the best for each other and your relationship, it only gets better
          from here!
        </p>
        <div className="flex items-center gap-4 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/report/welcome.jpg" alt="Noel and Karissa Meador" className="w-24 shrink-0" />
          <div>
            <p>Cheering for you,</p>
            <p className="mt-3">Noel and Karissa Meador</p>
            <p>Executive Director, Stronger Families and Co-Creator</p>
          </div>
        </div>
      </div>
    </ReportPage>
  );
}

type Point = ReturnType<typeof compassPoint>;

function Compass({ name, natural, adapted }: { name: string; natural: Point; adapted: Point }) {
  return (
    <ReportPage name={name}>
      <PageTitle>OXYGEN Compass</PageTitle>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          The OXYGEN Compass is a powerful visual tool to help you see the natural strengths of your relationship or
          family. It can also help you understand how the relationship or family is moving their strengths collectively
          to meet the demands of the current environment.
        </p>
        <p>
          Putting all the pieces together can give us a powerful picture of your relationship or family. It can drive
          objective discussion about what the natural strengths are and how each person feels they need to move, as a
          whole, to succeed in the current environment.
        </p>
        <p>Remember this is not designed to be absolute but to drive discussion.</p>
      </div>
      <CompassGraphic natural={natural} adapted={adapted} />
    </ReportPage>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 marker:text-[#00a8e1] [&>li]:list-disc">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function Sub({ children }: { children: string }) {
  return (
    <h3 className={`${headingFont.className} text-lg font-medium`} style={{ color: BLUE }}>
      {children}
    </h3>
  );
}

function Resources({ name }: { name: string }) {
  const link = "font-bold underline";

  return (
    <ReportPage name={name}>
      <h2 className={`${headingFont.className} text-4xl font-bold uppercase leading-none text-[#4c4c4c]`}>Resources</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <Sub>Receive your PREMIUM membership at strongerfamilies.com</Sub>
          <div className="sm:flex sm:items-start sm:gap-4">
            <div className="space-y-2 sm:flex-1">
              <p>
                Through our partnership with the USO, all active military members receive a FREE Premium Membership to
                many valuable relationship resources. Sign up at{" "}
                <a href="https://strongerfamilies.com/military-uso" className={link} style={{ color: BLUE }}>
                  strongerfamilies.com/military-uso
                </a>{" "}
                and start receiving important relationship tools and resources.
              </p>
              <Bullets
                items={[
                  "Podcasts with nationally acclaimed relationship experts",
                  "Tips for improving romance and intimacy",
                  "Creative date-night ideas",
                  "Much more!",
                ]}
              />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/report/resources-laptop.png" alt="" className="mt-3 w-full sm:mt-0 sm:w-56" />
          </div>
        </section>

        <section className="space-y-2 border-t pt-4" style={{ borderColor: BLUE }}>
          <div className="sm:flex sm:items-start sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/report/resources-seminar.jpg" alt="" className="mb-3 w-full sm:mb-0 sm:w-56" />
            <div className="space-y-2 sm:flex-1">
              <Sub>REGISTER for Live Oxygen Training Events</Sub>
              <p>
                If you&apos;re seeking to improve and strengthen your relationship, this seminar is for you. Ready to
                transform it within 24 hours? Through our partnership with the USO, these events are FREE to military
                members. Simply go to{" "}
                <a href="https://strongerfamilies.com/events" className={link} style={{ color: BLUE }}>
                  strongerfamilies.com/events
                </a>{" "}
                for dates and locations.
              </p>
              <p>Speakers address common relationship challenges, such as:</p>
              <Bullets items={["Personality Differences", "Intimacy", "Communication", "Forgiveness", "Conflict Resolution"]} />
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t pt-4" style={{ borderColor: BLUE }}>
          <div className="sm:flex sm:items-start sm:gap-4">
            <div className="space-y-2 sm:flex-1">
              <Sub>Certified Facilitator Training</Sub>
              <p>
                Uniquely designed with your leadership needs in mind. We guarantee a strong partnership with you every
                step of the way.
              </p>
              <ul className="space-y-1 pl-5 marker:text-[#00a8e1] [&>li]:list-disc">
                <li>World class relationship curriculum</li>
                <li>1-on-1 speaker training</li>
                <li>Customizable OXYGEN event options</li>
                <li>Accessible Delivery Team support</li>
              </ul>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/report/resources-training.jpg" alt="" className="mt-3 w-full sm:mt-0 sm:w-56" />
          </div>
        </section>

        <div className="flex items-center justify-between gap-4 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/report/stronger-families.png" alt="Stronger Families" className="w-36" />
          <span className="text-base text-[#111]">StrongerFamilies.com</span>
        </div>
      </div>
    </ReportPage>
  );
}
